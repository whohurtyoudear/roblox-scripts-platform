interface NotificationProps {
  show: boolean;
  message: string;
}

const Notification = ({ show, message }: NotificationProps) => {
  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg transition-opacity duration-300 flex items-center gap-2 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <i className="fas fa-check-circle"></i>
      <span>{message}</span>
    </div>
  );
};

export default Notification;
