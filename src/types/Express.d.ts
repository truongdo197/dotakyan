declare namespace Express {
  /**
   * Middleware verify the access token & assign more information to the Request params.
   */
  interface Request {
    /**
     * Id of the member
     */
    memberId?: number;
    /**
     * Id of the admin
     */
    userId?: number;
    /**
     * List permission of the admin
     */
    permissions?: number[];
    /**
     * Status of the admin/member
     */
    status?: number;
    name?: string;
  }
}
