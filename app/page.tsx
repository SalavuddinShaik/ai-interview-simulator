import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold text-blue-500">
        TailwindCSS is Working!
      </h1>
      <p className="text-lg text-gray-300 mt-4">
        This is a test page for TailwindCSS styling.
      </p>
    </div>
  );
}
