import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { ElevenLabsService } from './elevenlabs.service'
import { AuthGuard } from '@/common/guards/auth.guard'
import { TextToSpeechDto } from '@/common/dto/elevenlabs.dto'

@Controller('elevenlabs')
@UseGuards(AuthGuard)
export class ElevenLabsController {
  private readonly logger = new Logger(ElevenLabsController.name)

  constructor(private readonly elevenLabsService: ElevenLabsService) {}

  @Post('text-to-speech')
  async textToSpeech(
    @Body() textToSpeechDto: TextToSpeechDto,
    @Res() res: Response,
  ) {
    try {
      const { text, voiceId } = textToSpeechDto

      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Text is required')
      }

      // Get audio stream from ElevenLabs
      const audioStream = await this.elevenLabsService.textToSpeech(text, voiceId)

      // Set response headers
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Transfer-Encoding', 'chunked')

      // Pipe audio stream to response
      audioStream.pipe(res)
    } catch (error) {
      this.logger.error('Error in text-to-speech endpoint', error)
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Failed to convert text to speech',
          error: error.message,
        })
      }
    }
  }

  @Post('speech-to-text')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max file size
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/webm',
          'audio/flac',
          'audio/ogg',
          'audio/mp4',
          'audio/x-m4a',
        ]
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true)
        } else {
          callback(
            new BadRequestException(
              'Invalid file type. Only audio files are allowed.',
            ),
            false,
          )
        }
      },
    }),
  )
  async speechToText(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Audio file is required')
      }

      this.logger.log(
        `Received audio file: ${file.originalname} (${file.size} bytes)`,
      )

      // Convert speech to text
      const transcription = await this.elevenLabsService.speechToText(
        file.buffer,
        file.originalname,
      )

      return {
        text: transcription,
        success: true,
      }
    } catch (error) {
      this.logger.error('Error in speech-to-text endpoint', error)
      throw error
    }
  }

  @Post('voices')
  async getVoices() {
    try {
      const voices = await this.elevenLabsService.getVoices()
      return { voices }
    } catch (error) {
      this.logger.error('Error fetching voices', error)
      throw error
    }
  }
}

