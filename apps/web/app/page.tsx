export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Soul KG CRM
        </h1>
        <p className="text-gray-600 mb-8">
          Multi-tenant CRM system with AI agents
        </p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </a>
          <a
            href="/auth/register"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
