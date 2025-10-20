# Security with Helmet

## What is Helmet?

Helmet is a collection of middleware functions that set security-related HTTP headers to help protect your application from common web vulnerabilities.

## Integration

Helmet has been integrated into the NestJS boilerplate in `src/main.ts`:

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });
  
  // Apply Helmet security middleware
  app.use(helmet());
  
  // ... rest of configuration
}
```

## Security Headers Applied

Helmet sets the following HTTP headers by default:

### 1. **Content-Security-Policy**
- Helps prevent Cross-Site Scripting (XSS) attacks
- Controls which resources the browser is allowed to load

### 2. **X-DNS-Prefetch-Control**
- Controls browser DNS prefetching
- Helps prevent privacy leaks

### 3. **X-Frame-Options**
- Set to `SAMEORIGIN`
- Prevents clickjacking attacks by controlling if your site can be embedded in iframes

### 4. **X-Content-Type-Options**
- Set to `nosniff`
- Prevents browsers from MIME-sniffing
- Helps prevent XSS attacks

### 5. **Strict-Transport-Security (HSTS)**
- Forces browsers to use HTTPS
- Prevents protocol downgrade attacks

### 6. **X-Download-Options**
- Set to `noopen`
- Prevents Internet Explorer from executing downloads in your site's context

### 7. **X-Permitted-Cross-Domain-Policies**
- Restricts Adobe Flash and PDF cross-domain policies

### 8. **Referrer-Policy**
- Controls how much referrer information is included with requests

### 9. **X-XSS-Protection**
- Legacy XSS protection for older browsers
- Modern browsers use Content-Security-Policy instead

## Custom Configuration (Optional)

If you need to customize Helmet's behavior, you can pass options:

```typescript
// Example: Custom CSP for Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
```

## Common Issues & Solutions

### Issue: Swagger UI not loading after adding Helmet

If Content Security Policy blocks Swagger UI resources, you can relax CSP for development:

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP in development
    })
  );
} else {
  app.use(helmet()); // Full protection in production
}
```

### Issue: CORS errors after adding Helmet

Helmet doesn't handle CORS. If you need CORS, enable it separately:

```typescript
app.use(helmet());
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
});
```

## Verification

You can verify Helmet is working by inspecting HTTP response headers:

### Using PowerShell
```powershell
$response = Invoke-WebRequest -Uri http://localhost:3000 -Method Get
$response.Headers
```

### Using cURL
```bash
curl -I http://localhost:3000
```

### Expected Headers
You should see headers like:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=15552000; includeSubDomains`
- `X-DNS-Prefetch-Control: off`

## Best Practices

1. **Always use Helmet in production** - It's lightweight and adds essential security
2. **Customize CSP** - Default CSP might be too restrictive for some apps
3. **Enable HSTS in production** - Force HTTPS for all connections
4. **Test thoroughly** - Some security headers may break functionality if not configured properly
5. **Keep updated** - Regularly update Helmet to get latest security improvements

## Resources

- [Helmet Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
