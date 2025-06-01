import Image from "next/image"

export default function BenjaminPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
        <div className="relative w-64 h-64 mb-8">
          <div className="absolute inset-0 rounded-full border border-white"></div>
          <Image src="/images/benjamin.png" alt="Benjamin" fill className="rounded-full object-cover" priority />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">Building the APP Together</h1>
        <p className="text-xl text-gray-300">Turning your ideas into reality with clean, efficient code</p>
      </div>
    </div>
  )
}
