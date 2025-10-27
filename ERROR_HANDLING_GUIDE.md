# Error Handling Guide

## Overview

This B2B platform implements a comprehensive, centralized error handling system that provides:

- **User-friendly error messages** for all error scenarios
- **Automatic error notifications** via toast messages
- **React Error Boundaries** for catching UI errors
- **Custom error classes** on the backend
- **Validation error formatting** for forms
- **Automatic retry logic** for temporary errors
- **Error logging** and debugging support

---

## Table of Contents

1. [Frontend Error Handling](#frontend-error-handling)
2. [Backend Error Handling](#backend-error-handling)
3. [Error Codes Reference](#error-codes-reference)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)

---

## Frontend Error Handling

### 1. Error Handler Utility (`src/utils/errorHandler.js`)

The centralized error handler provides utilities for parsing and displaying errors.

#### Key Functions

**`handleApiError(error, options)`**
- Automatically displays error toasts
- Parses backend error responses
- Returns normalized error object
- Options: `{ silent: false, duration: 4000 }`

```javascript
import { handleApiError } from '../utils/errorHandler';

try {
  await api.post('/endpoint', data);
} catch (error) {
  const parsedError = handleApiError(error);
  console.error('Error details:', parsedError);
  // Toast is shown automatically
}
```

**`parseApiError(error)`**
- Normalizes error structure from API responses
- Returns: `{ message, status, errorCode, details, errors }`

**`getErrorMessage(errorCode, defaultMessage)`**
- Maps error codes to user-friendly messages
- Supports 30+ error codes
- Fallback to default message

**`formatValidationErrors(errors)`**
- Formats express-validator errors for forms
- Returns array of `{ field, message }` objects

```javascript
const formErrors = formatValidationErrors(error.errors);
// [{ field: 'email', message: 'Invalid email format' }, ...]
```

**`isAuthError(error)`**
- Checks if error is authentication-related
- Returns `true` for 401/403 or auth error codes

**`requiresReload(error)`**
- Checks if error requires page reload
- Returns `true` for version mismatches, CORS errors

**`isTemporaryError(error)`**
- Checks if error is temporary/retriable
- Returns `true` for network, timeout, server errors

**`getRetryDelay(attemptNumber)`**
- Exponential backoff for retries
- Returns delay in milliseconds

### 2. Error Boundary (`src/components/ErrorBoundary.jsx`)

React component that catches JavaScript errors in child components.

#### Features
- Catches render errors in component tree
- Automatic reload after 3 errors (prevents infinite loops)
- Development mode shows stack traces
- Provides user actions (Try Again, Reload, Go Home)

#### Usage

```javascript
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### When to Use
- Wrap entire app in `index.jsx`
- Wrap critical sections (payment forms, complex wizards)
- Wrap third-party components
- Wrap code splitting boundaries

### 3. Error Display Components (`src/components/ui/ErrorDisplay.jsx`)

Pre-built components for displaying errors in various contexts.

#### `<ErrorDisplay />`

Full error display with title, icon, and actions.

```javascript
<ErrorDisplay
  error={error}
  type="error" // 'error', 'warning', 'info'
  title="Something went wrong"
  details={error.details}
  onRetry={() => retryAction()}
  onClose={() => setError(null)}
  showDetails={true}
  className="my-4"
/>
```

#### `<InlineError />`

Compact error display for inline contexts.

```javascript
<InlineError
  message="Unable to load data"
  onRetry={() => fetchData()}
/>
```

#### `<FieldError />`

Form field error display.

```javascript
<FieldError
  error={errors.email}
  touched={touched.email}
/>
```

#### `<EmptyStateError />`

Empty state with error message and action.

```javascript
<EmptyStateError
  icon={Package}
  title="No products found"
  message="Try adjusting your filters"
  actionLabel="Clear filters"
  onAction={() => clearFilters()}
/>
```

### 4. API Service Integration (`src/services/api.js`)

The axios interceptor automatically handles all API errors.

#### Features
- Automatic toast notifications
- Auth error handling (auto-logout)
- Network error handling
- Validation error parsing
- Page reload for critical errors

#### Custom Handling

You can disable automatic error handling for specific calls:

```javascript
import { parseApiError } from '../utils/errorHandler';

try {
  const response = await api.post('/endpoint', data);
} catch (error) {
  // Handle error manually (no toast shown)
  const parsed = parseApiError(error);
  setFormErrors(parsed.errors);
}
```

To disable toast for a specific call:

```javascript
try {
  await api.post('/endpoint', data);
} catch (error) {
  const parsed = handleApiError(error, { silent: true });
  // No toast shown, but error is still parsed
}
```

---

## Backend Error Handling

### 1. Error Handler Middleware (`backend/middleware/errorHandler.js`)

Centralized error handling middleware with custom error classes.

#### Custom Error Classes

**`AppError`** - Base error class
```javascript
throw new AppError('User not found', 404, 'USER_NOT_FOUND');
```

**`ValidationError`** - For validation failures
```javascript
throw new ValidationError('Invalid email format', [
  { field: 'email', message: 'Must be valid email' }
]);
```

**`AuthenticationError`** - For auth failures
```javascript
throw new AuthenticationError('Invalid credentials');
```

**`AuthorizationError`** - For permission denied
```javascript
throw new AuthorizationError('Insufficient permissions');
```

**`NotFoundError`** - For resource not found
```javascript
throw new NotFoundError('Product');
```

**`ConflictError`** - For duplicate/conflict errors
```javascript
throw new ConflictError('Email already exists');
```

**`RateLimitError`** - For rate limiting
```javascript
throw new RateLimitError('Too many requests');
```

#### Error Response Format

```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "status": 404,
  "timestamp": "2025-10-26T12:00:00.000Z",
  "path": "/api/users/123",
  "details": {
    "userId": "123"
  }
}
```

#### Validation Error Format

```json
{
  "success": false,
  "error": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "status": 422,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ]
}
```

### 2. Error Handling in Routes

#### Using Custom Error Classes

```javascript
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('User');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

#### Using express-validator

```javascript
import { validationResult } from 'express-validator';
import { ValidationError } from '../middleware/errorHandler.js';

router.post('/users', validateUser, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    // Process request...
    res.json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
});
```

#### Async Error Handling

Use try-catch in all async route handlers and pass errors to `next()`.

```javascript
// ✅ Correct
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// ❌ Incorrect - unhandled promise rejection
router.get('/users', async (req, res) => {
  const users = await User.find(); // May throw
  res.json({ success: true, data: users });
});
```

---

## Error Codes Reference

### Authentication Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `AUTHENTICATION_ERROR` | Please login to continue | 401 |
| `INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `TOKEN_EXPIRED` | Your session has expired. Please login again. | 401 |
| `TOKEN_INVALID` | Invalid authentication token | 401 |

### Authorization Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `AUTHORIZATION_ERROR` | You don't have permission to access this resource | 403 |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | 403 |
| `SUBSCRIPTION_REQUIRED` | This feature requires an active subscription | 403 |
| `FEATURE_NOT_AVAILABLE` | This feature is not available in your current plan | 403 |

### Validation Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `VALIDATION_ERROR` | Please check your input and try again | 422 |
| `INVALID_EMAIL` | Invalid email address | 422 |
| `INVALID_PHONE` | Invalid phone number | 422 |
| `PASSWORD_TOO_WEAK` | Password must be at least 8 characters | 422 |
| `REQUIRED_FIELD` | This field is required | 422 |

### Resource Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `RESOURCE_NOT_FOUND` | The requested resource was not found | 404 |
| `USER_NOT_FOUND` | User not found | 404 |
| `PRODUCT_NOT_FOUND` | Product not found | 404 |
| `COMMUNITY_NOT_FOUND` | Community not found | 404 |

### Conflict Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `RESOURCE_CONFLICT` | This resource already exists | 409 |
| `EMAIL_EXISTS` | An account with this email already exists | 409 |
| `USERNAME_TAKEN` | This username is already taken | 409 |
| `DUPLICATE_ENTRY` | Duplicate entry | 409 |

### Business Logic Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `INSUFFICIENT_BALANCE` | Insufficient balance | 400 |
| `PAYMENT_FAILED` | Payment failed. Please check your payment details. | 400 |
| `SUBSCRIPTION_EXPIRED` | Your subscription has expired | 402 |
| `ACCOUNT_SUSPENDED` | Your account has been suspended | 403 |
| `VERIFICATION_REQUIRED` | Email or phone verification required | 403 |

### System Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `SERVER_ERROR` | Something went wrong. Please try again later. | 500 |
| `DATABASE_ERROR` | Database error occurred | 500 |
| `NETWORK_ERROR` | Network connection error. Please check your internet. | 0 |
| `TIMEOUT_ERROR` | Request timed out. Please try again. | 408 |
| `RATE_LIMIT_ERROR` | Too many requests. Please slow down. | 429 |

### File Upload Errors
| Code | Message | HTTP Status |
|------|---------|-------------|
| `FILE_TOO_LARGE` | File size exceeds maximum limit | 413 |
| `INVALID_FILE_TYPE` | Invalid file type | 400 |
| `UPLOAD_FAILED` | File upload failed. Please try again. | 500 |

---

## Usage Examples

### Example 1: Form Submission with Validation

```javascript
import { handleApiError, formatValidationErrors } from '../utils/errorHandler';
import { FieldError } from '../components/ui/ErrorDisplay';

function UserForm() {
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await userService.updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const parsedError = handleApiError(error);

      // Format validation errors for form fields
      if (parsedError.errors) {
        const fieldErrors = {};
        parsedError.errors.forEach(err => {
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <FieldError error={errors.email} touched={true} />
      </div>

      <div>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <FieldError error={errors.name} touched={true} />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Example 2: Data Fetching with Retry

```javascript
import { handleApiError, isTemporaryError, getRetryDelay } from '../utils/errorHandler';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.getProducts();
      setProducts(data.products);
      setRetryCount(0); // Reset on success
    } catch (error) {
      const parsedError = handleApiError(error, { silent: true });
      setError(parsedError);

      // Auto-retry for temporary errors
      if (isTemporaryError(error) && retryCount < 3) {
        const delay = getRetryDelay(retryCount);
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          fetchProducts();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchProducts}
        title="Failed to load products"
      />
    );
  }

  return <div>{/* Render products */}</div>;
}
```

### Example 3: Payment Processing

```javascript
import { handleApiError } from '../utils/errorHandler';

function PaymentForm() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const processPayment = async (paymentData) => {
    setProcessing(true);
    setError(null);

    try {
      const result = await subscriptionService.processPayment(
        subscriptionId,
        paymentData
      );

      toast.success('Payment successful!');
      navigate('/subscription/success');
    } catch (error) {
      const parsedError = handleApiError(error);

      // Show payment-specific error
      if (parsedError.errorCode === 'PAYMENT_FAILED') {
        setError({
          ...parsedError,
          action: 'Please verify your payment details and try again.'
        });
      } else if (parsedError.errorCode === 'INSUFFICIENT_BALANCE') {
        setError({
          ...parsedError,
          action: 'Please add funds to your account or use a different payment method.'
        });
      } else {
        setError(parsedError);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          type="error"
          title="Payment Failed"
          details={error.action}
          onRetry={() => processPayment(lastPaymentData)}
        />
      )}

      {/* Payment form fields */}
    </div>
  );
}
```

### Example 4: Backend Route with Custom Errors

```javascript
import {
  NotFoundError,
  AuthorizationError,
  ConflictError
} from '../middleware/errorHandler.js';

// Update subscription tier
router.post('/subscriptions/upgrade', auth, async (req, res, next) => {
  try {
    const { tier, billingCycle } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user can upgrade
    if (user.accountStatus === 'suspended') {
      throw new AuthorizationError('Cannot upgrade suspended account');
    }

    // Check for active subscription
    const activeSubscription = await Subscription.findOne({
      user: user._id,
      status: 'active'
    });

    if (activeSubscription && activeSubscription.tier === tier) {
      throw new ConflictError('You are already on this plan');
    }

    // Process upgrade
    const subscription = await subscriptionService.createSubscription(
      user._id,
      tier,
      billingCycle
    );

    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    next(error);
  }
});
```

---

## Best Practices

### 1. Always Use Try-Catch in Async Functions

```javascript
// ✅ Good
const fetchData = async () => {
  try {
    const data = await api.get('/data');
    setData(data);
  } catch (error) {
    handleApiError(error);
  }
};

// ❌ Bad - unhandled promise rejection
const fetchData = async () => {
  const data = await api.get('/data'); // May throw
  setData(data);
};
```

### 2. Use Error Boundaries for Component Errors

```javascript
// ✅ Good - Wrap components that may throw
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>

// ❌ Bad - No error boundary, entire app crashes
<ComplexComponent />
```

### 3. Provide Meaningful Error Messages

```javascript
// ✅ Good
throw new NotFoundError('Product', { productId: req.params.id });

// ❌ Bad
throw new Error('Not found');
```

### 4. Handle Validation Errors Gracefully

```javascript
// ✅ Good - Show field-specific errors
const errors = formatValidationErrors(error.errors);
errors.forEach(err => {
  setFieldError(err.field, err.message);
});

// ❌ Bad - Generic error message
toast.error('Validation failed');
```

### 5. Use Silent Mode When Needed

```javascript
// ✅ Good - Silent for background operations
const checkStatus = async () => {
  try {
    await api.get('/status');
  } catch (error) {
    handleApiError(error, { silent: true });
    // Handle silently
  }
};

// ❌ Bad - Annoying toast for every background check
const checkStatus = async () => {
  try {
    await api.get('/status');
  } catch (error) {
    handleApiError(error); // Shows toast every time
  }
};
```

### 6. Log Errors for Debugging

```javascript
// ✅ Good
try {
  await api.post('/endpoint', data);
} catch (error) {
  console.error('Error details:', {
    endpoint: '/endpoint',
    data,
    error: handleApiError(error)
  });
}
```

### 7. Provide Retry Options

```javascript
// ✅ Good
<ErrorDisplay
  error={error}
  onRetry={() => refetchData()}
  title="Failed to load data"
/>

// ❌ Bad - No way to recover
<ErrorDisplay
  error={error}
  title="Failed to load data"
/>
```

### 8. Use Appropriate Error Types

```javascript
// ✅ Good - Specific error types
if (!user) throw new NotFoundError('User');
if (!hasPermission) throw new AuthorizationError();
if (emailExists) throw new ConflictError('Email already exists');

// ❌ Bad - Generic errors
if (!user) throw new Error('Error');
if (!hasPermission) throw new Error('Error');
```

### 9. Don't Swallow Errors

```javascript
// ✅ Good
try {
  await saveData();
} catch (error) {
  handleApiError(error);
  // Optionally rethrow
  throw error;
}

// ❌ Bad - Error disappears
try {
  await saveData();
} catch (error) {
  // Nothing here
}
```

### 10. Test Error Scenarios

```javascript
// ✅ Good - Test error handling
it('should handle network errors', async () => {
  api.get.mockRejectedValue(new Error('Network error'));

  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText(/network connection error/i)).toBeInTheDocument();
  });
});
```

---

## Summary

This error handling system provides:

1. **Centralized error handling** - All errors go through the same pipeline
2. **User-friendly messages** - Technical errors are translated to readable messages
3. **Automatic notifications** - Toast messages appear automatically
4. **Type-safe error codes** - Consistent error codes across frontend and backend
5. **Validation support** - Field-level error display for forms
6. **Retry logic** - Automatic retries for temporary errors
7. **Error boundaries** - Catches React component errors
8. **Logging** - Errors are logged for debugging
9. **Customizable** - Can be extended with custom error types and messages

For questions or issues, refer to the inline code documentation or contact the development team.
