/**
 * Tenant Middleware
 * 
 * Middleware for ensuring tenant isolation (organizationId from JWT)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure organizationId is set from JWT token
 * This ensures all requests are scoped to the user's organization
 */
export function ensureTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.organizationId) {
    res.status(401).json({ error: 'Organization context required' });
    return;
  }

  // Attach organizationId to request for easy access
  req.body.organizationId = req.user.organizationId;
  next();
}


