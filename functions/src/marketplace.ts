// functions/src/marketplace.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onApplicationAccepted = functions.firestore
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

export const onContractCompleted = functions.firestore
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
  });

export const onDoctorReviewCreated = functions.firestore
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

export const onCompanyReviewCreated = functions.firestore
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
