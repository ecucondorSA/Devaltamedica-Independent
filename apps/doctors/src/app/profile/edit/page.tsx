// apps/doctors/src/app/profile/edit/page.tsx
import React from 'react';

const ProfileEditPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Public Profile</h1>
      <div className="p-4 border rounded-lg">
        <form>
          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea id="bio" name="bio" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Availability</label>
            <input type="text" id="availability" name="availability" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="mb-4">
            <label htmlFor="desiredRate" className="block text-sm font-medium text-gray-700">Desired Rate</label>
            <input type="text" id="desiredRate" name="desiredRate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditPage;
