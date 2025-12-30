"use strict";
// SIMPLE SEEDER - RBAC System
// Run: npx tsx prisma/seed.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var dotenv = require("dotenv");
// Load env
dotenv.config({ path: ".env.local" });
// Initialize Prisma
var adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
var prisma = new client_1.PrismaClient({ adapter: adapter });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var permissions, _i, permissions_1, perm, superAdminRole, allPerm, dcm, hpal, area1, building1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n🌱 SEEDING DATABASE - RBAC SYSTEM\n");
                    // ========================================
                    // 1. PERMISSIONS
                    // ========================================
                    console.log("📝 Creating permissions...");
                    permissions = [
                        { key: "*", description: "Super Admin - All Access", category: "system" },
                        { key: "home:read", description: "View home page", category: "general" },
                        { key: "dashboard:read", description: "View dashboard", category: "general" },
                        { key: "admin:read", description: "Access admin area", category: "admin" },
                        { key: "companies:read", description: "View companies", category: "property" },
                    ];
                    _i = 0, permissions_1 = permissions;
                    _a.label = 1;
                case 1:
                    if (!(_i < permissions_1.length)) return [3 /*break*/, 4];
                    perm = permissions_1[_i];
                    return [4 /*yield*/, prisma.permission.upsert({
                            where: { key: perm.key },
                            update: {},
                            create: perm,
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("   \u2705 ".concat(permissions.length, " permissions"));
                    // ========================================
                    // 2. ROLES
                    // ========================================
                    console.log("👥 Creating roles...");
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { name: "super-admin" },
                            update: {},
                            create: {
                                name: "super-admin",
                                description: "Full system access",
                                isSystemRole: true,
                            },
                        })];
                case 5:
                    superAdminRole = _a.sent();
                    return [4 /*yield*/, prisma.permission.findUnique({ where: { key: "*" } })];
                case 6:
                    allPerm = _a.sent();
                    if (!allPerm) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma.rolePermission.upsert({
                            where: {
                                roleId_permissionId: {
                                    roleId: superAdminRole.id,
                                    permissionId: allPerm.id,
                                },
                            },
                            update: {},
                            create: {
                                roleId: superAdminRole.id,
                                permissionId: allPerm.id,
                            },
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    console.log("   ✅ super-admin role");
                    // ========================================
                    // 3. COMPANIES
                    // ========================================
                    console.log("🏢 Creating companies...");
                    return [4 /*yield*/, prisma.company.upsert({
                            where: { code: "DCM" },
                            update: {},
                            create: {
                                code: "DCM",
                                name: "PT. Dharma Cipta Mulia",
                                status: true,
                            },
                        })];
                case 9:
                    dcm = _a.sent();
                    return [4 /*yield*/, prisma.company.upsert({
                            where: { code: "HPAL" },
                            update: {},
                            create: {
                                code: "HPAL",
                                name: "PT. Halmahera Persada Lygend",
                                status: true,
                            },
                        })];
                case 10:
                    hpal = _a.sent();
                    console.log("   ✅ DCM, HPAL");
                    // ========================================
                    // 4. USER ROLES (WITH SNAPSHOT)
                    // ========================================
                    console.log("👤 Creating user roles...");
                    // User 1: d12345 = SUPER ADMIN ✨
                    return [4 /*yield*/, prisma.userRole.upsert({
                            where: {
                                usernameKey_roleId_companyId: {
                                    usernameKey: "d12345", // lowercase
                                    roleId: superAdminRole.id,
                                    companyId: dcm.id,
                                },
                            },
                            update: {},
                            create: {
                                username: "D12345", // Original case
                                usernameKey: "d12345", // Lowercase untuk search
                                displayName: "Super User",
                                email: "superadmin@company.com",
                                roleId: superAdminRole.id,
                                companyId: dcm.id,
                            },
                        })];
                case 11:
                    // User 1: d12345 = SUPER ADMIN ✨
                    _a.sent();
                    // User 2: D0525000109 = SUPER ADMIN
                    return [4 /*yield*/, prisma.userRole.upsert({
                            where: {
                                usernameKey_roleId_companyId: {
                                    usernameKey: "d0525000109",
                                    roleId: superAdminRole.id,
                                    companyId: dcm.id,
                                },
                            },
                            update: {},
                            create: {
                                username: "D0525000109",
                                usernameKey: "d0525000109",
                                displayName: "Gandi Purna Jen",
                                email: "gpjen95@gmail.com",
                                roleId: superAdminRole.id,
                                companyId: dcm.id,
                            },
                        })];
                case 12:
                    // User 2: D0525000109 = SUPER ADMIN
                    _a.sent();
                    // User 3: L0721001028 = SUPER ADMIN
                    return [4 /*yield*/, prisma.userRole.upsert({
                            where: {
                                usernameKey_roleId_companyId: {
                                    usernameKey: "l0721001028",
                                    roleId: superAdminRole.id,
                                    companyId: hpal.id,
                                },
                            },
                            update: {},
                            create: {
                                username: "L0721001028",
                                usernameKey: "l0721001028",
                                displayName: "Novi Ikhtiarullah",
                                email: "novi.ikhtiarullah@hpalnickel.com",
                                roleId: superAdminRole.id,
                                companyId: hpal.id,
                            },
                        })];
                case 13:
                    // User 3: L0721001028 = SUPER ADMIN
                    _a.sent();
                    console.log("   ✅ 3 super admins (d12345, D0525000109, L0721001028)");
                    // ========================================
                    // 5. AREAS & BUILDINGS
                    // ========================================
                    console.log("🏗️  Creating areas & buildings...");
                    return [4 /*yield*/, prisma.area.upsert({
                            where: { code: "KWS-PABRIK" },
                            update: {},
                            create: {
                                code: "KWS-PABRIK",
                                name: "Kawasan Pabrik",
                                status: true,
                            },
                        })];
                case 14:
                    area1 = _a.sent();
                    return [4 /*yield*/, prisma.building.upsert({
                            where: { code: "GB-01" },
                            update: {},
                            create: {
                                code: "GB-01",
                                name: "Gedung A",
                                areaId: area1.id,
                                status: true,
                            },
                        })];
                case 15:
                    building1 = _a.sent();
                    console.log("   ✅ 1 area, 1 building");
                    // ========================================
                    // 6. USER BUILDING ACCESS (WITH SNAPSHOT)
                    // ========================================
                    console.log("🔑 Granting building access...");
                    // d12345 → Building access
                    return [4 /*yield*/, prisma.userBuilding.upsert({
                            where: {
                                usernameKey_buildingId: {
                                    usernameKey: "d12345",
                                    buildingId: building1.id,
                                },
                            },
                            update: {},
                            create: {
                                username: "D12345",
                                usernameKey: "d12345",
                                displayName: "Super User",
                                email: "superadmin@company.com",
                                buildingId: building1.id,
                            },
                        })];
                case 16:
                    // d12345 → Building access
                    _a.sent();
                    console.log("   ✅ d12345 has building access");
                    // ========================================
                    // SUMMARY
                    // ========================================
                    console.log("\n🎉 DATABASE SEEDING COMPLETE!\n");
                    console.log("📊 Summary:");
                    console.log("   - Permissions: ".concat(permissions.length));
                    console.log("   - Roles: 1 (super-admin)");
                    console.log("   - Companies: 2 (DCM, HPAL)");
                    console.log("   - Users: 3 super admins");
                    console.log("   - Areas: 1");
                    console.log("   - Buildings: 1");
                    console.log("\n✨ d12345 is now SUPER ADMIN with full access!\n");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("\n❌ SEEDING FAILED:", e.message);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
