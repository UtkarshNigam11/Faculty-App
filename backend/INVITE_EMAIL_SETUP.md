# Invite Email Template Setup

The default Supabase invite link goes to Supabase's verify page, which redirects with tokens in the URL hash. Some browsers/redirects drop the hash, causing "no invite token" errors.

**Solution:** Use a custom link in the invite email that goes to our backend first. The backend exchanges the token and redirects to the registration page with the token in the query string (reliable).

## Steps

### 1. Add Redirect URL in Supabase

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**

Add:
```
https://faculty-app-j8ct.onrender.com/api/auth/confirm-invite
```

### 2. Update Invite Email Template

Go to **Supabase Dashboard** → **Authentication** → **Email Templates** → **Invite user**

Replace the default link with this custom link. Change the "Accept the invite" link from:
```
{{ .ConfirmationURL }}
```

To:
```
https://faculty-app-j8ct.onrender.com/api/auth/confirm-invite?token_hash={{ .TokenHash }}&type=invite
```

### 3. Full Template Example

```html
<h2>You're Invited!</h2>
<p>You have been invited to join the Faculty Substitute App.</p>
<p>Click the link below to set your password and complete registration:</p>
<p><a href="https://faculty-app-j8ct.onrender.com/api/auth/confirm-invite?token_hash={{ .TokenHash }}&type=invite">Complete Registration</a></p>
```

## Flow

1. User clicks link → Goes to backend `/api/auth/confirm-invite?token_hash=xxx&type=invite`
2. Backend calls Supabase POST /verify → Gets access_token
3. Backend redirects to `https://faculty-app-landing.pages.dev/complete-registration?access_token=xxx`
4. Registration page receives token in query (reliable) → Shows form → User sets password
