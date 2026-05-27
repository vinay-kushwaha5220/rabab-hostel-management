export declare const generateAccessToken: (userId: number, role: string) => string;
export declare const generateRefreshToken: (userId: number) => string;
export declare const verifyAccessToken: (token: string) => {
    userId: number;
    role: string;
};
export declare const verifyRefreshToken: (token: string) => {
    userId: number;
};
export declare const getRefreshTokenExpiry: () => Date;
//# sourceMappingURL=jwt.d.ts.map