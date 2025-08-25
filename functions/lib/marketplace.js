"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCompanyReviewCreated = exports.onDoctorReviewCreated = exports.onContractCompleted = exports.onApplicationAccepted = void 0;
// functions/src/marketplace.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.onApplicationAccepted = functions.firestore
    .document('listing_applications/{applicationId}')
    .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    if (newValue.status === 'accepted' && previousValue.status !== 'accepted') {
        const { listingId, doctorId, companyId } = newValue;
        // Create a new contract
        const contractRef = admin.firestore().collection('contracts').doc();
        await contractRef.set({
            listingId,
            doctorId,
            companyId,
            terms: 'Standard terms and conditions.',
            startDate: new Date().toISOString(),
            endDate: null,
            paymentDetails: 'To be determined.',
            status: 'active',
            createdAt: new Date().toISOString(),
        });
        console.log(`Contract ${contractRef.id} created for application ${context.params.applicationId}`);
        // TODO: Send notifications to the company and the doctor
    }
    return null;
});
exports.onContractCompleted = functions.firestore
    .document('contracts/{contractId}')
    .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();
    if (newValue.status === 'completed' && previousValue.status !== 'completed') {
        const { contractId } = context.params;
        await admin.firestore().collection('contracts').doc(contractId).update({
            readyForReview: true,
        });
        return null;
    }
});
exports.onDoctorReviewCreated = functions.firestore
    .document('doctor_reviews/{reviewId}')
    .onCreate(async (snap, context) => {
    const { doctorId, rating } = snap.data();
    const doctorRef = admin.firestore().collection('doctors').doc(doctorId);
    const reviewsSnapshot = await admin.firestore().collection('doctor_reviews').where('doctorId', '==', doctorId).get();
    const ratings = reviewsSnapshot.docs.map(doc => doc.data().rating);
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await doctorRef.update({ averageRating });
    console.log(`Updated average rating for doctor ${doctorId} to ${averageRating}`);
    return null;
});
exports.onCompanyReviewCreated = functions.firestore
    .document('company_reviews/{reviewId}')
    .onCreate(async (snap, context) => {
    const { companyId, rating } = snap.data();
    const companyRef = admin.firestore().collection('companies').doc(companyId);
    const reviewsSnapshot = await admin.firestore().collection('company_reviews').where('companyId', '==', companyId).get();
    const ratings = reviewsSnapshot.docs.map(doc => doc.data().rating);
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await companyRef.update({ averageRating });
    console.log(`Updated average rating for company ${companyId} to ${averageRating}`);
    return null;
});
//# sourceMappingURL=marketplace.js.map