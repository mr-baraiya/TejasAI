import React, { useState } from 'react';
import { X, CheckCircle, PaperPlaneTilt, ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react';
import { submitContactForm } from '../services/api';

const CATEGORIES = [
  { id: 'Feedback', label: 'Feedback', placeholder: 'Tell us what you like or how we can make TejasAI better for you...' },
  { id: 'Bug Report', label: 'Bug Report', placeholder: 'Describe what happened, your browser, and any steps to reproduce the issue...' },
  { id: 'Feature Request', label: 'Feature Request', placeholder: 'What new prompt framework, AI model, or capability would you like to see?' },
  { id: 'General Inquiry', label: 'General Inquiry', placeholder: 'How can we help you? Feel free to ask any question...' },
];

export function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Feedback');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  if (!isOpen) return null;

  const currentCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address.';
        }
        return '';
      case 'phone':
        if (value.trim() && !/^[\d\s+\-()]{7,20}$/.test(value.trim())) {
          return 'Please enter a valid phone number.';
        }
        return '';
      case 'comments':
        if (!value.trim()) return 'Please enter your comments or feedback.';
        if (value.trim().length < 5) return 'Feedback must be at least 5 characters.';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'name' ? name : field === 'email' ? email : field === 'phone' ? phone : comments;
    const err = validateField(field, val);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'phone') setPhone(value);
    if (field === 'comments') setComments(value);

    if (touched[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleClear = () => {
    setName('');
    setEmail('');
    setCategory('Feedback');
    setPhone('');
    setComments('');
    setTouched({});
    setFieldErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const phoneErr = validateField('phone', phone);
    const commentsErr = validateField('comments', comments);

    const allErrors = {
      name: nameErr,
      email: emailErr,
      phone: phoneErr,
      comments: commentsErr,
    };

    setFieldErrors(allErrors);
    setTouched({ name: true, email: true, phone: true, comments: true });

    if (nameErr || emailErr || phoneErr || commentsErr) {
      if (nameErr) document.getElementById('contact-name')?.focus();
      else if (emailErr) document.getElementById('contact-email')?.focus();
      else if (phoneErr) document.getElementById('contact-phone')?.focus();
      else if (commentsErr) document.getElementById('contact-comments')?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        category,
        phone: phone.trim(),
        comments: comments.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    handleClear();
    setSubmitted(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-none border border-[#EDE8E1] bg-[#FFFBF5] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Close Icon */}
        <div className="flex items-start justify-between border-b border-[#EDE8E1] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] tracking-tight">
              Contact information
            </h2>
            <p className="text-xs text-[#DC2626] font-medium mt-1.5 flex items-center gap-1">
              <span>*</span> Required
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#EDE8E1]/50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Confirmation Success Screen */
          <div className="py-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-8 h-8" weight="fill" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-serif font-bold text-[#111827]">
                Your response has been recorded.
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
                Thank you for reaching out! Your feedback has been forwarded directly to the TejasAI team.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full sm:w-auto px-4 py-2 border border-[#EDE8E1] bg-[#FFFFFF] hover:bg-[#F9F6F0] text-xs font-semibold text-[#374151] cursor-pointer transition-colors"
              >
                Submit another response
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-[#111827] hover:bg-[#374151] text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Google Forms Style Clean Minimal Form */
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {serverError && (
              <div className="p-3 bg-red-50 border-l-4 border-[#DC2626] text-xs text-[#991B1B]">
                {serverError}
              </div>
            )}

            {/* Field: Name */}
            <div className="space-y-1.5 group">
              <label htmlFor="contact-name" className="block text-sm font-medium text-[#111827]">
                Name <span className="text-[#DC2626] font-bold">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Short answer text"
                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors ${
                  touched.name && fieldErrors.name
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#D1D5DB] group-hover:border-[#9CA3AF] focus:border-[#C2410C]'
                }`}
              />
              {touched.name && fieldErrors.name && (
                <p className="text-xs text-[#DC2626] font-medium mt-1 flex items-center gap-1">
                  <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5 group">
              <label htmlFor="contact-email" className="block text-sm font-medium text-[#111827]">
                Email <span className="text-[#DC2626] font-bold">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Short answer text"
                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors ${
                  touched.email && fieldErrors.email
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#D1D5DB] group-hover:border-[#9CA3AF] focus:border-[#C2410C]'
                }`}
              />
              {touched.email && fieldErrors.email && (
                <p className="text-xs text-[#DC2626] font-medium mt-1 flex items-center gap-1">
                  <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Field: Category Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#111827]">
                Category <span className="text-[#DC2626] font-bold">*</span>
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-2 pt-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <label
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 cursor-pointer select-none group whitespace-nowrap"
                    >
                      <input
                        type="radio"
                        name="contact-category"
                        value={cat.id}
                        checked={isSelected}
                        onChange={() => setCategory(cat.id)}
                        className="w-3.5 h-3.5 accent-[#C2410C] text-[#C2410C] cursor-pointer"
                      />
                      <span
                        className={`text-xs transition-colors ${
                          isSelected
                            ? 'text-[#111827] font-semibold'
                            : 'text-[#6B7280] group-hover:text-[#111827]'
                        }`}
                      >
                        {cat.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Field: Phone Number */}
            <div className="space-y-1.5 group">
              <label htmlFor="contact-phone" className="block text-sm font-medium text-[#111827]">
                Phone number <span className="text-[#9CA3AF] text-xs font-normal">(optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="Short answer text"
                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors ${
                  touched.phone && fieldErrors.phone
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#D1D5DB] group-hover:border-[#9CA3AF] focus:border-[#C2410C]'
                }`}
              />
              {touched.phone && fieldErrors.phone && (
                <p className="text-xs text-[#DC2626] font-medium mt-1 flex items-center gap-1">
                  <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Field: Comments / Long answer text tailored to Category */}
            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label htmlFor="contact-comments" className="block text-sm font-medium text-[#111827]">
                  Comments <span className="text-[#DC2626] font-bold">*</span>
                </label>
                <span className="text-[11px] text-[#C2410C] font-medium">
                  {currentCategoryObj.label} mode
                </span>
              </div>
              <textarea
                id="contact-comments"
                rows={4}
                value={comments}
                onChange={(e) => handleChange('comments', e.target.value)}
                onBlur={() => handleBlur('comments')}
                placeholder={currentCategoryObj.placeholder || 'Long answer text'}
                className={`w-full bg-transparent border-0 border-b px-0 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-colors resize-y min-h-[90px] ${
                  touched.comments && fieldErrors.comments
                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                    : 'border-[#D1D5DB] group-hover:border-[#9CA3AF] focus:border-[#C2410C]'
                }`}
              />
              {touched.comments && fieldErrors.comments && (
                <p className="text-xs text-[#DC2626] font-medium mt-1 flex items-center gap-1">
                  <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="bold" />
                  <span>{fieldErrors.comments}</span>
                </p>
              )}
            </div>

            {/* Form Footer Action Buttons & Branding Watermark */}
            <div className="pt-4 border-t border-[#EDE8E1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#111827] hover:bg-[#374151] disabled:bg-[#9CA3AF] text-white text-xs font-semibold tracking-wide cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors py-2 px-2 flex items-center gap-1"
                >
                  <ArrowCounterClockwise className="w-3.5 h-3.5" />
                  Clear form
                </button>
              </div>

              {/* Watermark aligned with reference image footer style */}
              <div className="text-[11px] text-[#9CA3AF] sm:text-right font-mono">
                &copy; TejasAI Support Desk
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
