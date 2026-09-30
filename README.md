# Remora

> **Let nothing stop you.**

Remora is a personal productivity and organization web app built to bring tasks, university work, job-related activities, notes, clients, work-hour tracking, progress insights, and protected credentials into one place.

The project started as a personal productivity tool and evolved into a modular, responsive application powered by React, Vite, and Firebase, with offline support, PWA capabilities, encrypted account storage, Passkeys, backups, global search, and real-time synchronization.

---

## Features

### Task Management

Remora supports multiple activity categories:

- University
- Work
- Tasks
- Reminders
- Alekey

Each activity can include:

- Title
- Description
- Date and time
- Priority
- Checklist
- Resources and links
- Completion status
- Archive status
- Progress tracking

The Home page also includes a configurable summary with:

- Today's activities
- Next deadline
- Pending activities

On mobile, the summary can be collapsed to keep the interface compact.

---

## University

University activities can be associated with specific courses.

The current setup includes courses such as:

- Discrete Mathematics 2
- Physics 1
- Leadership and Collaborative Work

This keeps academic activities separated and easier to organize.

---

## Alekey Work-Hour Tracking

Remora includes a dedicated workflow for recording Alekey work sessions.

When using:

```text
Alekey → Worker
```

a work entry can contain up to five time segments.

Example:

```text
08:00 - 12:00
13:00 - 17:00
```

Remora automatically calculates:

- Total hours worked
- Payment for the session
- Accumulated earnings

### Payment Modes

Supported payment modes include:

- Default hourly rate of ₡1,500/hour
- Custom hourly rate
- Fixed payment per work session

Example:

```text
8 hours × ₡1,500 = ₡12,000
```

or:

```text
Fixed payment = ₡20,000
```

---

## Progress

The Progress section provides an overview of productivity and work information.

It includes:

- Completion percentage
- Completed activities
- Pending activities
- Category distribution
- Upcoming activities
- Pending client payments
- Alekey work hours
- Total earnings

Progress can be filtered by period:

```text
This week
This month
All time
```

### Hours by Day

Alekey work sessions are grouped by date and can display:

- Hours worked
- Number of sessions
- Earnings
- Payment mode

By default, only the two most recent days are shown.

If more records are available, Remora provides:

```text
View all
Minimize
```

Work sessions can also be selected individually or all at once and removed manually after payment has been received.

Before deleting paid sessions, Remora asks for confirmation and shows the selected hours and corresponding payment amount.

---

## Notes

Remora includes a modular notes system.

Features include:

- Create notes
- Edit notes
- Delete notes
- Pin notes
- Search notes
- Manual sorting
- Drag-and-drop reordering

Notes can contain different block types:

- Text
- Checklist
- Pending items

---

## Clients

The Clients section provides a lightweight way to manage customers and payments.

A client record can include:

- Name
- Products
- Quantities
- Prices
- Total
- Payment status

The Progress section also shows pending clients and the total amount still unpaid.

---

## Protected Accounts Vault

Remora includes an encrypted vault for storing sensitive account information.

It can be used for data such as:

- Email accounts
- Usernames
- Passwords
- PINs
- Identification numbers
- Other private account details

### Vault Security

The Accounts section includes:

- Master password
- Automatic lock after 3 minutes
- Passkeys
- Device authentication
- Recovery code
- AES-GCM encryption
- PBKDF2-based password protection

Passkeys are registered per domain, which means a credential created on `localhost` is not automatically treated as valid on the production Vercel domain.

The master password remains available as a fallback even when a Passkey is registered.

On supported devices, the operating system may use:

- Fingerprint
- Face recognition
- Device PIN
- Windows Hello

---

## Global Search

Remora includes a global search experience available from the header.

It can also be opened with:

```text
Ctrl + K
```

or:

```text
Cmd + K
```

Search can cover:

- Tasks
- Notes
- Clients
- Protected accounts while the vault is unlocked

---

## Settings

The Settings section centralizes application preferences.

It includes options for:

- Notifications
- Notification lead time
- Backups
- Data import
- PWA installation
- Connection status
- Security-related settings

---

## Notifications

Remora is prepared to work with Firebase Cloud Messaging.

Notification lead times can include options such as:

- 30 minutes before
- 1 hour before
- 2 hours before
- 1 day before

Background scheduled notifications require the corresponding Firebase backend configuration.

---

## Backups

Remora supports exporting user data as a backup and importing it later.

Backups can include:

- Tasks
- Notes
- Clients
- Preferences
- Encrypted account data

Sensitive vault content remains encrypted.

---

## PWA and Offline Support

Remora is designed as a Progressive Web App.

Features include:

- Installable web app experience
- Service Worker support
- Firestore persistence
- Offline-aware behavior
- Connection status feedback
- Cached data where available

---

## Responsive Design

Remora is designed for both desktop and mobile use.

### Desktop

The desktop header includes:

- Remora branding
- Search
- Settings
- User profile
- Sign out

### Mobile

On smaller screens, Remora uses a floating three-dot menu with access to:

- Search
- Account / sign out
- Settings

The main navigation is displayed as an animated bottom navigation bar.

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Framer Motion
- Lucide React
- DnD Kit

### Backend and Services

- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Messaging
- Firebase Functions-ready structure
- Service Workers
- IndexedDB
- Firestore persistent cache

### Security

- Web Authentication API
- Passkeys
- Web Crypto API
- AES-GCM
- PBKDF2
- Recovery keys

---

## Project Structure

```text
src/
├── assets/
├── components/
│   ├── accounts/
│   ├── clients/
│   ├── common/
│   ├── dashboard/
│   ├── history/
│   ├── navigation/
│   ├── notes/
│   ├── progress/
│   ├── search/
│   └── tasks/
├── constants/
├── hooks/
├── pages/
├── services/
├── styles/
├── utils/
├── App.jsx
└── main.jsx
```

The project is organized to keep UI components, application state, Firebase logic, security services, business rules, and styling separated.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/alestooo/remora-app.git
```

Enter the project:

```bash
cd remora-app
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

---

## Production Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The compiled application is generated in:

```text
dist/
```

---

## Firebase

Remora uses Firebase for authentication, storage, synchronization, and notification infrastructure.

The main Firebase configuration is located in:

```text
src/services/firebase.js
```

Main flow:

```text
Firebase Authentication
        ↓
Google Sign-In

Cloud Firestore
        ↓
Tasks
Notes
Clients
Preferences
Security metadata
Encrypted accounts

Firebase Cloud Messaging
        ↓
Notification infrastructure
```

Sensitive credentials and environment-specific values should not be committed to the repository.

---

## Application Flow

```text
Google Sign-In
      │
      ▼
    Remora
      │
      ├── Home
      │    ├── Summary
      │    ├── Tasks
      │    ├── University
      │    ├── Work
      │    └── Alekey
      │
      ├── Tools
      │    ├── Calculator
      │    ├── Grade calculator
      │    ├── Notes
      │    └── Clients
      │
      ├── Progress
      │    ├── Productivity
      │    ├── Alekey hours
      │    ├── Earnings
      │    └── Pending clients
      │
      ├── Accounts
      │    └── Encrypted vault
      │
      └── Settings
           ├── Notifications
           ├── Backup
           ├── PWA
           └── Security
```

---

## Project Status

Remora is under active development.

Core functionality is already implemented, including:

- Task management
- Notes
- Clients
- Work-hour tracking
- Progress statistics
- Encrypted account vault
- Passkeys
- Recovery support
- Global search
- Backups
- PWA support
- Responsive UI
- Offline-aware Firestore behavior

Future improvements may include:

- Advanced statistics
- Improved payment history
- More automated notification workflows
- Additional accessibility improvements
- More automated tests
- Performance optimization
- Expanded Passkey device compatibility

---

## License

Remora is source-available for portfolio, educational, evaluation, and reference purposes.

The source code may not be redistributed, republished, commercially exploited, rebranded, or used to create derivative products without prior written permission.

See the [LICENSE](LICENSE) file for full terms.

---

## Author

**Alejandro Soto Víquez**

Software Engineering Student  
Full Stack Developer

GitHub: [@alestooo](https://github.com/alestooo)

---

## Remora

**Let nothing stop you.**
