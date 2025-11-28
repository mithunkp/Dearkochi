// app/about/page.js
export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About Us</h1>
          <p className="text-lg text-gray-600 mb-6">
            Welcome to our website! We are dedicated to providing excellent service 
            and creating amazing experiences for our users.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            Our mission is to simplify complex tasks and provide intuitive solutions 
            that make life easier for everyone.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">What We Do</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Create innovative web applications</li>
            <li>Provide reliable services</li>
            <li>Support our community</li>
            <li>Continuously improve and evolve</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">Contact</h2>
          <p className="text-gray-600">
            Email: hello@example.com<br />
            Phone: (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
}