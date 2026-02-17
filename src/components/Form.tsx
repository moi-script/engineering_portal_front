import React, { useState, ChangeEvent, FormEvent } from 'react';
import FetchData from './FetchData';
import api from '@/services/api';

const Form = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  // Typed change handler
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Typed submit handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await api.post(`${import.meta.env.VITE_API_URL}/addPerson`, formData);
      alert(response.data);
    } catch (error) {
      console.error(error);
      alert('Error submitting form');
    }
  };

  return (
    <>  
    <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <textarea name="message" placeholder="Message" onChange={handleChange} />
        <button type="submit">Submit</button>
    </form>
    <FetchData/>
    </>
  );
};

export default Form;