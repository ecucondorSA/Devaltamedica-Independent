"use strict";
/**
 * Firebase Functions para ALTAMEDICA
 * Sistema Unificado de Autenticación
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCompanyReviewCreated = exports.onDoctorReviewCreated = exports.onContractCompleted = exports.onApplicationAccepted = exports.updateCustomClaims = exports.setCustomClaims = void 0;
// Exportar funciones de custom claims
var setCustomClaims_1 = require("./setCustomClaims");
Object.defineProperty(exports, "setCustomClaims", { enumerable: true, get: function () { return setCustomClaims_1.setCustomClaims; } });
Object.defineProperty(exports, "updateCustomClaims", { enumerable: true, get: function () { return setCustomClaims_1.updateCustomClaims; } });
// Exportar funciones de marketplace
var marketplace_1 = require("./marketplace");
Object.defineProperty(exports, "onApplicationAccepted", { enumerable: true, get: function () { return marketplace_1.onApplicationAccepted; } });
Object.defineProperty(exports, "onContractCompleted", { enumerable: true, get: function () { return marketplace_1.onContractCompleted; } });
Object.defineProperty(exports, "onDoctorReviewCreated", { enumerable: true, get: function () { return marketplace_1.onDoctorReviewCreated; } });
Object.defineProperty(exports, "onCompanyReviewCreated", { enumerable: true, get: function () { return marketplace_1.onCompanyReviewCreated; } });
//# sourceMappingURL=index.js.map