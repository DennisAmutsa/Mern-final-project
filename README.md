# Hospital Management System - SDG 3

A comprehensive hospital management system built for **SDG 3: Good Health and Well-being**. This system helps healthcare facilities manage patients, doctors, appointments, emergency cases, and inventory while tracking their impact on sustainable development goals.

## 🌟 Features

### Core Management
- **Patient Management**: Complete patient registration, medical history, and status tracking
- **Doctor Management**: Staff profiles, specializations, availability scheduling
- **Appointment System**: Smart scheduling with conflict detection and doctor availability
- **Emergency Management**: Urgent care case handling and priority management
- **Inventory Control**: Medical supplies and equipment tracking with alerts
- **Statistics & Analytics**: Comprehensive reporting for SDG 3 impact measurement

### SDG 3 Alignment
- **Healthcare Access**: Track patient coverage and service delivery
- **Quality Care**: Monitor medical staff and treatment outcomes
- **Emergency Response**: Manage urgent care and critical cases
- **Resource Management**: Optimize medical supplies and equipment usage
- **Impact Reporting**: Generate reports for sustainable development goals

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** for database
- **Mongoose** for ODM
- **JWT** for authentication
- **Helmet** for security

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **Recharts** for data visualization

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- pnpm (recommended) or npm
- MongoDB Atlas account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hospital-management-sdg3
   ```

2. **Install backend dependencies**
   ```bash
   pnpm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   pnpm install
   cd ..
   ```

4. **Configure environment variables**
   - Copy `config.env.example` to `config.env`
   - Update MongoDB connection string and other settings

5. **Start the development servers**
   ```bash
   # Start both backend and frontend
   pnpm dev
   
   # Or start them separately
   pnpm server    # Backend only
   pnpm client    # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📊 Database Schema

### Patients
- Personal information and contact details
- Medical history and current medications
- Insurance and emergency contacts
- Status tracking (Active, Emergency, Discharged)

### Doctors
- Professional information and specializations
- Availability schedules and contact details
- Experience and certifications
- Status management (Active, On Leave, Emergency)

### Appointments
- Patient-doctor scheduling
- Conflict detection and resolution
- Status tracking and follow-up management
- Payment and insurance integration

### Emergency Cases
- Urgent care management
- Priority classification
- Real-time status updates
- Outcome tracking

### Inventory
- Medical supplies tracking
- Stock level monitoring
- Expiry date alerts
- Cost management

## 🔧 API Endpoints

### Patients
- `GET /api/patients` - Get all patients with pagination
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/stats/overview` - Patient statistics

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/available/:date/:time` - Check availability

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/today/schedule` - Today's schedule
- `PUT /api/appointments/:id/status` - Update status

### Statistics
- `GET /api/stats/sdg3-overview` - SDG 3 impact metrics
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/department-performance` - Department analytics

## 🎯 SDG 3 Impact Metrics

The system tracks key indicators aligned with SDG 3:

### Healthcare Access
- Total patients served
- Active patient count
- Emergency cases handled
- Appointment completion rates

### Healthcare Quality
- Medical staff count and availability
- Emergency response times
- Patient satisfaction metrics
- Treatment outcome tracking

### Healthcare Coverage
- Department coverage analysis
- Gender equity in healthcare access
- Age group distribution
- Geographic coverage mapping

## 📱 Screenshots

*[Screenshots will be added here]*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- United Nations Sustainable Development Goals
- Healthcare professionals for domain expertise
- Open source community for tools and libraries

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for SDG 3: Good Health and Well-being** 