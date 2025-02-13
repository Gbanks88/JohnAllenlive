# Google Workspace Setup for John Allen's Fashion

## Email Configuration
1. Go to [Google Workspace](https://workspace.google.com/)
2. Sign up for Business Starter plan
3. Add domain: johnallens.live
4. Set up users:
   - john@johnallens.live (Admin)
   - support@johnallens.live
   - sales@johnallens.live
   - virtual-tryon@johnallens.live

## DNS Configuration
Add these MX records:
```
Priority | Host | Points to
---------|------|----------
1        | @    | ASPMX.L.GOOGLE.COM
5        | @    | ALT1.ASPMX.L.GOOGLE.COM
5        | @    | ALT2.ASPMX.L.GOOGLE.COM
10       | @    | ALT3.ASPMX.L.GOOGLE.COM
10       | @    | ALT4.ASPMX.L.GOOGLE.COM
```

Add these TXT records:
```
Host | Type | Value
-----|------|-------
@    | TXT  | v=spf1 include:_spf.google.com ~all
```

## Security Settings
- Enable 2-factor authentication
- Set up recovery email
- Configure email filtering
- Enable enhanced security features

## Email Groups
Create these groups:
- team@johnallens.live (Internal team)
- customers@johnallens.live (Customer communications)
- virtual-support@johnallens.live (Virtual try-on support)

## Integration with Website
1. Set up email forwarding from contact forms
2. Configure virtual try-on notifications
3. Set up order confirmation emails
4. Configure newsletter system
