# Custom Categories - Deployment Checklist

## Pre-Deployment Checklist

- [ ] All code changes committed to version control
- [ ] Backend tests passing (if applicable)
- [ ] Frontend builds successfully
- [ ] No TypeScript errors
- [ ] Documentation reviewed

## Deployment Steps

### Step 1: Deploy Firestore Indexes

```bash
cd web
firebase deploy --only firestore:indexes
```

**Expected Output:**
```
✔ Deploy complete!
```

**Verification:**
- Go to Firebase Console → Firestore Database → Indexes
- Verify you see indexes for `custom_categories` collection
- Wait for indexes to finish building (status should be "Enabled")

### Step 2: Deploy Backend

```bash
cd backend

# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Test locally first (optional)
npm run start:dev

# Deploy to your hosting service
# (Replace with your deployment command)
# Examples:
# - Heroku: git push heroku main
# - Railway: railway up
# - Google Cloud: gcloud app deploy
# - AWS: eb deploy
```

**Verification:**
- Test the category endpoints:
  ```bash
  curl -X GET https://your-api-url.com/category \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- Should return an array with default categories

### Step 3: Deploy Frontend

```bash
cd web

# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Test the build locally (optional)
npm run start

# Deploy to your hosting service
# Examples:
# - Vercel: vercel --prod
# - Netlify: netlify deploy --prod
# - Firebase: firebase deploy --only hosting
```

**Verification:**
- Visit your app URL
- Navigate to `/app/goals/settings`
- Verify the Category Manager loads

### Step 4: Post-Deployment Testing

#### Test 1: Create a Custom Category
- [ ] Navigate to Goals → Settings
- [ ] Click "New Category"
- [ ] Enter name: "Test Category"
- [ ] Choose a color
- [ ] Add an icon (e.g., 🎯)
- [ ] Click "Create"
- [ ] Verify category appears in the list

#### Test 2: Use Custom Category in Goal
- [ ] Navigate to Goals
- [ ] Click "New Goal"
- [ ] Select your custom category from dropdown
- [ ] Verify it appears with color and icon
- [ ] Complete and save the goal
- [ ] Verify goal is created with custom category

#### Test 3: Edit Custom Category
- [ ] Go to Settings
- [ ] Click edit icon on your test category
- [ ] Change the name to "Updated Test"
- [ ] Change the color
- [ ] Click "Update"
- [ ] Verify changes are saved

#### Test 4: Delete Custom Category
- [ ] Create a goal with your test category
- [ ] Go to Settings
- [ ] Click delete icon on test category
- [ ] Confirm deletion
- [ ] Verify category is deleted
- [ ] Check that the goal was moved to "Other" category

#### Test 5: Default Categories
- [ ] Verify all default categories still work
- [ ] Create a goal with "Career" category
- [ ] Verify it saves correctly

## Rollback Plan

If something goes wrong:

### Backend Rollback
```bash
# Revert to previous deployment
# (Command depends on your hosting service)
# Examples:
# - Heroku: heroku rollback
# - Railway: railway rollback
# - Google Cloud: gcloud app versions list, then deploy previous version
```

### Frontend Rollback
```bash
# Revert to previous deployment
# Examples:
# - Vercel: vercel rollback
# - Netlify: Use Netlify dashboard to rollback
# - Firebase: firebase hosting:rollback
```

### Database Rollback
- Custom categories are additive, so no rollback needed
- If needed, you can manually delete the `custom_categories` collection
- Existing goals will continue to work with default categories

## Monitoring

### What to Monitor

1. **Backend Logs**
   - Check for errors in category endpoints
   - Monitor response times
   - Watch for authentication issues

2. **Frontend Console**
   - Check for JavaScript errors
   - Monitor API call failures
   - Watch for loading issues

3. **Firestore Usage**
   - Monitor read/write operations
   - Check index usage
   - Watch for quota limits

### Common Issues

**Issue: Categories not loading**
- Check: Are Firestore indexes built?
- Check: Is user authenticated?
- Check: Backend API responding?

**Issue: Cannot create category**
- Check: Is name unique?
- Check: Is color format valid (#RRGGBB)?
- Check: Backend validation errors in logs

**Issue: Goals not updating after category deletion**
- Check: Backend batch operation logs
- Check: Firestore permissions
- Check: Network connectivity

## Performance Considerations

### Expected Load
- Categories are loaded once per session
- Minimal database reads (cached in frontend)
- Batch operations for category deletion
- Indexed queries for fast retrieval

### Optimization Tips
- Categories are cached after first load
- Use pagination if users have many categories (future enhancement)
- Monitor Firestore read/write costs
- Consider CDN caching for static assets

## Security Verification

- [ ] All category operations require authentication
- [ ] Users can only access their own categories
- [ ] Category ownership verified on all operations
- [ ] No sensitive data exposed in API responses
- [ ] Firestore security rules enforce user isolation

## Success Criteria

✅ **Deployment is successful if:**
- Users can create custom categories
- Custom categories appear in goal form
- Goals can be created with custom categories
- Categories can be edited and deleted
- Default categories still work
- No errors in logs
- Performance is acceptable

## Support

If you encounter issues:

1. **Check Documentation**
   - `docs/CUSTOM_CATEGORIES.md` - Full documentation
   - `docs/CUSTOM_CATEGORIES_QUICKSTART.md` - Quick start guide
   - `docs/CUSTOM_CATEGORIES_SUMMARY.md` - Implementation summary

2. **Review Code**
   - Backend: `backend/src/category/`
   - Frontend: `web/components/category-manager.tsx`
   - API Client: `web/lib/api/client.ts`

3. **Check Logs**
   - Backend logs for API errors
   - Browser console for frontend errors
   - Firestore logs for database issues

4. **Test Locally**
   - Run backend: `cd backend && npm run start:dev`
   - Run frontend: `cd web && npm run dev`
   - Test all functionality locally first

## Post-Deployment Tasks

- [ ] Announce feature to users
- [ ] Update user documentation
- [ ] Monitor usage and feedback
- [ ] Plan future enhancements
- [ ] Consider adding analytics

## Future Enhancements

Consider these improvements for future releases:
- Category analytics (goal count, completion rate)
- Category templates/presets
- Category sharing between users
- Bulk category operations
- Category-based theming
- Icon library picker
- Category ordering/favorites

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Version:** _____________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
