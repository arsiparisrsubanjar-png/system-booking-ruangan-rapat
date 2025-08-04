import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- Type Definitions ---
interface Booking {
    id: number;
    title: string;
    room: 'Ruang Edellweis' | 'Ruang Zoom Cempaka';
    date: string;
    startTime: string;
    endTime: string;
}

type NewBooking = Omit<Booking, 'id'>;

interface BookingFormProps {
    onAddBooking: (booking: NewBooking) => void;
}

interface ScheduleListProps {
    title: string;
    bookings: Booking[];
    onDeleteBooking: (id: number) => void;
}

interface ScheduleItemProps {
    booking: Booking;
    onDelete: (id: number) => void;
}


const App = () => {
    // State to hold all bookings, initialized from localStorage
    const [bookings, setBookings] = useState<Booking[]>(() => {
        try {
            const savedBookings = localStorage.getItem('bookings');
            return savedBookings ? JSON.parse(savedBookings) : [];
        } catch (error) {
            console.error("Could not parse bookings from localStorage", error);
            return [];
        }
    });

    // Persist bookings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('bookings', JSON.stringify(bookings));
        } catch (error) {
            console.error("Could not save bookings to localStorage", error);
        }
    }, [bookings]);

    const addBooking = (booking: NewBooking) => {
        // Simple validation
        if (!booking.title || !booking.room || !booking.date || !booking.startTime || !booking.endTime) {
            alert('Harap isi semua kolom.');
            return;
        }
        if (booking.endTime <= booking.startTime) {
            alert('Waktu selesai harus setelah waktu mulai.');
            return;
        }

        // Conflict Detection
        const newBookingStart = new Date(`${booking.date}T${booking.startTime}`);
        const newBookingEnd = new Date(`${booking.date}T${booking.endTime}`);

        const isConflict = bookings.some(existingBooking => {
            if (existingBooking.room !== booking.room) {
                return false; // No conflict if it's a different room
            }
            const existingStart = new Date(`${existingBooking.date}T${existingBooking.startTime}`);
            const existingEnd = new Date(`${existingBooking.date}T${existingBooking.endTime}`);
            
            // Check for overlap:
            // (StartA < EndB) and (StartB < EndA)
            return newBookingStart < existingEnd && existingStart < newBookingEnd;
        });

        if (isConflict) {
            alert('Jadwal bentrok! Ruangan ini sudah dipesan pada waktu tersebut. Silakan pilih waktu lain.');
            return;
        }


        setBookings(prevBookings => [...prevBookings, { ...booking, id: Date.now() }]);
    };

    const deleteBooking = (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            setBookings(prevBookings => prevBookings.filter(booking => booking.id !== id));
        }
    };

    // Filter and sort bookings for each room
    const edelweissBookings = bookings
        .filter(b => b.room === 'Ruang Edellweis')
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    const cempakaBookings = bookings
        .filter(b => b.room === 'Ruang Zoom Cempaka')
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

    return (
        <div className="app-container">
            <header>
                <h1>Sistem Booking Ruang Rapat</h1>
            </header>
            <main className="main-content">
                <BookingForm onAddBooking={addBooking} />
                <div className="schedules-container">
                    <ScheduleList title="Ruang Edellweis" bookings={edelweissBookings} onDeleteBooking={deleteBooking} />
                    <ScheduleList title="Ruang Zoom Cempaka" bookings={cempakaBookings} onDeleteBooking={deleteBooking} />
                </div>
            </main>
        </div>
    );
};

const BookingForm = ({ onAddBooking }: BookingFormProps) => {
    const [title, setTitle] = useState('');
    const [room, setRoom] = useState<'Ruang Edellweis' | 'Ruang Zoom Cempaka'>('Ruang Edellweis');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAddBooking({ title, room, date, startTime, endTime });
        // Reset form
        setTitle('');
        setRoom('Ruang Edellweis');
        setDate('');
        setStartTime('');
        setEndTime('');
    };

    return (
        <form className="booking-form" onSubmit={handleSubmit}>
            <h2>Buat Jadwal Baru</h2>
            <div className="form-group">
                <label htmlFor="title">Nama Acara</label>
                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="room">Pilih Ruangan</label>
                <select id="room" value={room} onChange={e => setRoom(e.target.value as 'Ruang Edellweis' | 'Ruang Zoom Cempaka')} required>
                    <option value="Ruang Edellweis">Ruang Edellweis</option>
                    <option value="Ruang Zoom Cempaka">Ruang Zoom Cempaka</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="date">Tanggal</label>
                <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
                <label>Waktu</label>
                <div className="time-inputs">
                    <input type="time" aria-label="Waktu Mulai" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    <input type="time" aria-label="Waktu Selesai" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
            </div>
            <button type="submit" className="submit-btn">Simpan Jadwal</button>
        </form>
    );
};

const ScheduleList = ({ title, bookings, onDeleteBooking }: ScheduleListProps) => {
    return (
        <div className="schedule-list">
            <h3>{title}</h3>
            {bookings.length > 0 ? (
                bookings.map(booking => (
                    <ScheduleItem key={booking.id} booking={booking} onDelete={onDeleteBooking} />
                ))
            ) : (
                <p className="no-bookings">Belum ada jadwal.</p>
            )}
        </div>
    );
};

const ScheduleItem = ({ booking, onDelete }: ScheduleItemProps) => {
    const formatDate = (dateString: string) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }
    
    return (
        <div className="schedule-item">
            <div className="schedule-details">
                <strong>{booking.title}</strong>
                <span>{formatDate(booking.date)}</span>
                <span>Pukul {booking.startTime} - {booking.endTime}</span>
            </div>
            <button className="delete-btn" onClick={() => onDelete(booking.id)} aria-label={`Hapus jadwal ${booking.title}`}>&times;</button>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);