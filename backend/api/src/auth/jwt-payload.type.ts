/** JWT payload structure. Tokens are issued by an external auth service. */
export interface JwtPayload {
  sub: string; // user id
}
