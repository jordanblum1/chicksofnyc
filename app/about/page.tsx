'use client';
import { useState } from 'react';
import MenuBar from '../components/MenuBar';

export default function About() {
  const [formState, setFormState] = useState({
    wingPlace: '',
    additionalInfo: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formState);
  };

  return (
    <div>
      <MenuBar />
      <div className="container mx-auto p-6">
        <section className="hero text-center py-20 bg-gray-100">
          <h1 className="text-4xl font-bold mb-4">About the Wing Man</h1>
          <p className="text-lg text-gray-700">Discover the best wing spots around!</p>
        </section>

        <section className="content my-10">
          <p className="text-gray-800">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </section>

        <section className="form-section my-10">
          <h2 className="text-2xl font-semibold mb-6">Suggest a Wing Spot</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="wingPlace" className="block text-gray-700">Wing Place from Google Maps:</label>
              <input
                type="text"
                id="wingPlace"
                name="wingPlace"
                value={formState.wingPlace}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div>
              <label htmlFor="additionalInfo" className="block text-gray-700">Additional Info:</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formState.additionalInfo}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700">Email (optional):</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Submit</button>
          </form>
        </section>
      </div>
    </div>
  );
}
