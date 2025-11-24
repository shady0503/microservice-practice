import UserDashboard from './user/UserDashboard'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const UserService = ({ onBack }) => {
  return (
    <div className="min-h-screen relative">
      {onBack && (
        <div className="absolute top-4 left-4 lg:top-6 lg:left-6 z-50">
          <Button
            variant="outline"
            onClick={onBack}
            className="group bg-white/95 backdrop-blur-xl hover:bg-white border-2 border-gray-300/80 hover:border-blue-400 shadow-lg hover:shadow-xl rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-300 text-gray-700 group-hover:text-blue-600" />
            <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300 text-sm">Retour</span>
          </Button>
        </div>
      )}
      <UserDashboard />
    </div>
  )
}

export default UserService