# 🩸 Blood Donor Finder

A website that connects blood donors with patients and their families in times of need. Donors can register and be discovered quickly, and patients or families can search for compatible donors by blood group and location.

[![Figma](https://img.shields.io/badge/Figma-Design-F24E1E?logo=figma&logoColor=white)](https://www.figma.com/proto/Uw1nlpizaVn9ydIFNY5bDz/Donor?page-id=0%3A1&node-id=1-115&p=f&viewport=435%2C364%2C0.15&t=d2e7jyptfMvgKrTH-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A972)

---

## 📌 About the Project

Finding the right blood donor in an emergency is often slow and stressful. **Blood Donor Finder** simplifies this by providing:

- A simple way for donors to register and share their availability
- A fast search for patients and families to find donors by blood group and location
- A clean, mobile-friendly experience that works when time matters most

---

## 🎨 Design

The UI/UX was designed in Figma, with separate flows for the two types of users.

| User Type | Description | Prototype |
|-----------|-------------|-----------|
| 🩸 **Donor** | Register, manage profile, and set availability | [View Donor Prototype](https://www.figma.com/proto/Uw1nlpizaVn9ydIFNY5bDz/Donor?page-id=0%3A1&node-id=1-115&p=f&viewport=435%2C364%2C0.15&t=d2e7jyptfMvgKrTH-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A972) |
| 🏥 **Patient / Family** | Search for donors and send requests | [View Patient/Family Prototype](https://www.figma.com/proto/WJo7ObUQ64qxdDGyJn7Frr/Patient-Family?page-id=0%3A1%3Fnode-id%3D1-312&p=f&viewport=464%2C299%2C0.16&t=1gnFVkyAj7T5b196-1&scaling=scale-down&content-scaling=fixed&starting-point-node-id=1%3A312&node-id=1-166) |

### Screenshots

#### Donor Flow

| Home | Register | Profile |
|------|----------|---------|
| ![Donor Home](./screenshots/donor-home.png) | ![Donor Register](./screenshots/donor-register.png) | ![Donor Profile](./screenshots/donor-profile.png) |

#### Patient / Family Flow

| Home | Search Donors | Donor Details |
|------|---------------|---------------|
| ![Patient Home](./screenshots/patient-home.png) | ![Search](./screenshots/patient-search.png) | ![Details](./screenshots/patient-details.png) |

> 💡 Export frames from Figma as PNG and place them in the `screenshots/` folder.

---

## ✨ Features

### For Donors
- Create an account and register as a blood donor
- Add blood group, location, and contact details
- Update availability status
- Receive requests from patients and families

### For Patients / Families
- Search donors by blood group and location
- View donor details and availability
- Contact donors directly
- Post urgent blood requirements

---

## 🛠️ Tech Stack

> Update this section with the technologies you are using.

| Layer | Technology |
|-------|------------|
| Frontend | React / HTML, CSS, JavaScript |
| Backend | Node.js / Express |
| Database | MongoDB / MySQL |
| Design | Figma |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or above)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/blood-donor-finder.git

# Go into the project folder
cd blood-donor-finder

# Install dependencies
npm install

# Start the development server
npm start
```

The app will run at `http://localhost:3000`.

---

## 📁 Project Structure

```
blood-donor-finder/
├── screenshots/        # Design screenshots
├── src/
│   ├── components/
│   ├── pages/
│   └── App.js
├── public/
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Your Name**
- GitHub: [@your-username](https://github.com/your-username)

---

> ❤️ *Donate blood, save lives.*
