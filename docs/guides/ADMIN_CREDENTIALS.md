# Decision PRO Admin Dashboard - Login Credentials

## ✅ ADMIN CREDENTIALS (VERIFIED WORKING)

**Username**: `admin`  
**Password**: `admin123`

**Status**: ✅ Password verified and account unlocked

## Access URL

**Development**: http://localhost:4009

## Testing Instructions

1. Open http://localhost:4009 in your browser
2. You will be redirected to the login page (`/login`)
3. Enter:
   - Username: `admin`
   - Password: `admin123`
4. Click "Sign In"
5. You should be redirected to `/dashboard`

## API Gateway Status

- ✅ API Gateway is running and accessible
- ✅ Login endpoint is working
- ✅ Admin account is unlocked and active
- ✅ Password verification successful

## Troubleshooting

If login fails:
1. **Check browser console** for errors (F12 → Console tab)
2. **Verify API Gateway** is running: `curl http://196.188.249.48:4000/health`
3. **Check Next.js logs**: `tail -f /tmp/nextjs-dev.log`
4. **Test API directly**:
   ```bash
   curl -X POST http://196.188.249.48:4000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

## Known Issues Fixed

1. ✅ **Hydration error** - Fixed by adding mounted state checks in `DashboardLayout` and `Sidebar`
2. ✅ **Account locked** - Admin account was locked due to failed attempts, now unlocked
3. ✅ **API error handling** - Improved error responses in API client
4. ✅ **Password verification** - Confirmed password `admin123` is correct

## Additional Notes

- If the account gets locked again (after 5 failed attempts), you can unlock it by resetting `is_locked = false` and `failed_login_attempts = 0` in the database
- The account will automatically unlock after 15 minutes, or you can manually reset it as shown above
