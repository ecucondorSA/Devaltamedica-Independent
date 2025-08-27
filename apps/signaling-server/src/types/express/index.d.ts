import { User } from '../../middleware/auth.middleware.js';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}
