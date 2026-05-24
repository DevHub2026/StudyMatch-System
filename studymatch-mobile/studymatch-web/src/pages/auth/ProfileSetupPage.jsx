import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as profileApi from '../../api/profile'
import { saveAuth, getToken } from '../../store/authStore'
import {
  Camera, Upload, ArrowRight, ArrowLeft, Check,
  User, BookOpen, Target, Layout, Clock, Users, Zap
} from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Basic Info' },
  { num: 2, label: 'About You' },
  { num: 3, label: 'Study Goals' },
  { num: 4, label: 'Subjects' },
  { num: 5, label: 'Preferences' },
  { num: 6, label: 'Availability' },
]

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Engineering', 'Literature', 'History',
  'Economics', 'Business', 'Psychology', 'Art',
  'Statistics', 'Data Science', 'Philosophy', 'Law',
]

const STUDY_GOALS = [
  'Pass my midterms with good grades',
  'Improve my problem solving skills',
  'Understand concepts deeply',
  'Stay consistent and build habit',
  'Prepare for exams',
  'Complete assignments faster',
  'Learn new skills',
  'Get better grades overall',
]

const svgArrow = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23ffffff44' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    full_name: '', institution: '', course: '', year_of_study: '', location: '',
    // Step 2: About You (bio)
    bio: '',
    // Step 3: Study Goals
    study_goals: [],
    // Step 4: Subjects
    study_subjects: [],
    // Step 5: Preferences
    preferred_study_time: '', study_location_preference: '', learning_style: '',
    partner_gender_preference: '', partner_year_preference: '', max_partners: 5,
    // Step 6: Availability
    availability: { weekdays: '', saturday: '', sunday: '', timezone: '' },
    // Personal
    phone: '', date_of_birth: '', gender: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleAvailChange = (key, value) => {
    setFormData(prev => ({ ...prev, availability: { ...prev.availability, [key]: value } }))
  }

  const toggleArr = (key, val) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val]
    }))
  }

  const handleNext = async (e) => {
    e.preventDefault()
    setLoading(true); setErrors({})
    try {
      let response
      if (step === 1) {
        response = await profileApi.updateProfileStep2({
          institution: formData.institution,
          course: formData.course,
          year_of_study: parseInt(formData.year_of_study),
          major: formData.full_name,
        })
      } else if (step === 2) {
        response = await profileApi.updateProfileStep1({ bio: formData.bio })
      } else if (step === 4) {
        response = await profileApi.updateProfileStep3({
          study_subjects: formData.study_subjects,
          preferred_study_time: formData.preferred_study_time,
          study_location_preference: formData.study_location_preference,
          learning_style: formData.learning_style,
        })
      } else if (step === 6) {
        response = await profileApi.updateProfileStep4({
          partner_gender_preference: formData.partner_gender_preference,
          partner_year_preference: formData.partner_year_preference,
          max_partners: parseInt(formData.max_partners),
        })
        saveAuth(getToken(), response.user)
        navigate('/student/dashboard')
        return
      }
      setStep(s => s + 1)
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (step < 6) setStep(s => s + 1)
    else navigate('/student/dashboard')
  }

  const yearLabel = (y) => {
    const s = ['st','nd','rd']
    return `${y}${s[y-1] || 'th'} Year`
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .ps-root {
          font-family:'Poppins',sans-serif; color:#ddd8ff;
          min-height:100vh; background:#07061a;
          display:flex; flex-direction:column;
        }

        /* ── Top bar ── */
        .ps-topbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 40px; border-bottom:1px solid rgba(120,90,240,0.12);
          flex-shrink:0;
        }

        .ps-logo { font-size:20px; font-weight:700; color:#eae6ff; }
        .ps-logo span { color:#7c5cfa; }
        .ps-step-label { font-size:13px; font-weight:600; color:#7c5cfa; }

        /* ── Content ── */
        .ps-content { flex:1; padding:32px 40px; max-width:1000px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:24px; }

        /* ── Page heading ── */
        .ps-heading { display:flex; flex-direction:column; gap:4px; }
        .ps-title { font-size:24px; font-weight:700; color:#eae6ff; }
        .ps-sub { font-size:13px; color:rgba(255,255,255,0.3); }

        /* ── Step indicators ── */
        .ps-steps { display:flex; align-items:center; gap:0; }
        .ps-step-item { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; position:relative; }
        .ps-step-item:not(:last-child)::after {
          content:''; position:absolute; top:18px; left:calc(50% + 18px);
          width:calc(100% - 36px); height:1px;
          background:rgba(120,90,240,0.2);
        }
        .ps-step-item.done::after { background:#7c5cfa; }
        .ps-step-circle {
          width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:700; z-index:1; transition:all 0.3s;
        }
        .ps-step-circle.active { background:#7c5cfa; color:#fff; box-shadow:0 0 0 4px rgba(124,92,250,0.2); }
        .ps-step-circle.done { background:#7c5cfa; color:#fff; }
        .ps-step-circle.pending { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.1); }
        .ps-step-name { font-size:11px; font-weight:500; white-space:nowrap; }
        .ps-step-name.active { color:#c4b8ff; }
        .ps-step-name.done { color:#a78bfa; }
        .ps-step-name.pending { color:rgba(255,255,255,0.2); }

        /* ── Section card ── */
        .ps-card { background:rgba(255,255,255,0.03); border:1px solid rgba(120,90,240,0.14); border-radius:16px; padding:24px 28px; }
        .ps-card-title { font-size:16px; font-weight:700; color:#eae6ff; margin-bottom:4px; }
        .ps-card-sub { font-size:12px; color:rgba(255,255,255,0.3); margin-bottom:20px; }

        /* ── Form grid ── */
        .ps-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
        .ps-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .ps-field { display:flex; flex-direction:column; gap:6px; }
        .ps-label { font-size:11px; font-weight:600; color:rgba(255,255,255,0.4); letter-spacing:0.3px; }

        .ps-input {
          background:rgba(255,255,255,0.04); border:1px solid rgba(120,90,240,0.18);
          border-radius:10px; color:#ddd8ff; font-size:13px; font-family:'Poppins',sans-serif;
          padding:11px 14px; outline:none; transition:border-color 0.2s,background 0.2s; width:100%;
        }
        .ps-input:focus { border-color:rgba(124,92,250,0.5); background:rgba(124,92,250,0.06); }
        .ps-input::placeholder { color:rgba(255,255,255,0.15); }

        .ps-select {
          background:rgba(255,255,255,0.04); border:1px solid rgba(120,90,240,0.18);
          border-radius:10px; color:#ddd8ff; font-size:13px; font-family:'Poppins',sans-serif;
          padding:11px 32px 11px 14px; outline:none; cursor:pointer;
          -webkit-appearance:none; appearance:none;
          background-repeat:no-repeat; background-position:right 12px center;
          transition:border-color 0.2s; width:100%;
        }
        .ps-select:focus { border-color:rgba(124,92,250,0.5); }
        .ps-select option { background:#120f2e; }

        .ps-textarea {
          background:rgba(255,255,255,0.04); border:1px solid rgba(120,90,240,0.18);
          border-radius:10px; color:#ddd8ff; font-size:13px; font-family:'Poppins',sans-serif;
          padding:12px 14px; outline:none; resize:none; width:100%; height:110px;
          transition:border-color 0.2s,background 0.2s;
        }
        .ps-textarea:focus { border-color:rgba(124,92,250,0.5); background:rgba(124,92,250,0.06); }
        .ps-textarea::placeholder { color:rgba(255,255,255,0.15); }

        .ps-char-count { font-size:11px; color:rgba(255,255,255,0.2); text-align:right; margin-top:4px; }

        /* ── Photo upload ── */
        .ps-photo-wrap { display:flex; align-items:center; gap:24px; }
        .ps-photo-circle { width:80px; height:80px; border-radius:50%; background:rgba(124,92,250,0.1); border:2px dashed rgba(124,92,250,0.3); display:flex; align-items:center; justify-content:center; color:rgba(124,92,250,0.5); cursor:pointer; flex-shrink:0; transition:all 0.2s; }
        .ps-photo-circle:hover { border-color:rgba(124,92,250,0.6); background:rgba(124,92,250,0.15); }
        .ps-photo-upload-btn { padding:10px 20px; border-radius:9px; background:rgba(124,92,250,0.12); border:1px solid rgba(124,92,250,0.3); color:#a78bfa; font-size:13px; font-weight:600; font-family:'Poppins',sans-serif; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all 0.2s; }
        .ps-photo-upload-btn:hover { background:#7c5cfa; color:#fff; border-color:#7c5cfa; }
        .ps-photo-hint { font-size:11px; color:rgba(255,255,255,0.25); margin-top:5px; }
        .ps-photo-tip { flex:1; background:rgba(124,92,250,0.07); border:1px solid rgba(124,92,250,0.15); border-radius:10px; padding:12px 16px; font-size:12px; color:rgba(255,255,255,0.4); line-height:1.5; }

        /* ── Checkbox tags ── */
        .ps-tags-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .ps-tag-btn { padding:7px 14px; border-radius:20px; font-size:12px; font-weight:500; font-family:'Poppins',sans-serif; cursor:pointer; transition:all 0.2s; border:1px solid rgba(120,90,240,0.2); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.4); }
        .ps-tag-btn:hover { border-color:rgba(124,92,250,0.4); color:#c4b8ff; background:rgba(124,92,250,0.08); }
        .ps-tag-btn.selected { border-color:#7c5cfa; background:rgba(124,92,250,0.18); color:#c4b8ff; }

        /* ── Avail row ── */
        .ps-avail-row { display:grid; grid-template-columns:140px 1fr 1fr; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid rgba(120,90,240,0.08); }
        .ps-avail-row:last-child { border-bottom:none; }
        .ps-avail-day { font-size:13px; color:rgba(255,255,255,0.5); font-weight:500; }

        /* ── Error ── */
        .ps-error { font-size:11px; color:#f87171; margin-top:3px; }
        .ps-general-error { padding:10px 14px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:10px; font-size:13px; color:#f87171; }

        /* ── Bottom bar ── */
        .ps-bottom { position:sticky; bottom:0; background:rgba(7,6,26,0.9); backdrop-filter:blur(12px); border-top:1px solid rgba(120,90,240,0.12); padding:16px 40px; display:flex; align-items:center; justify-content:space-between; }
        .ps-back-btn { padding:11px 22px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.4); font-size:14px; font-weight:600; font-family:'Poppins',sans-serif; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all 0.2s; }
        .ps-back-btn:hover { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.7); }
        .ps-next-btn { padding:11px 28px; border-radius:10px; background:#7c5cfa; border:none; color:#fff; font-size:14px; font-weight:600; font-family:'Poppins',sans-serif; cursor:pointer; display:flex; align-items:center; gap:7px; transition:opacity 0.2s,transform 0.15s; }
        .ps-next-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .ps-next-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .ps-skip-btn { background:none; border:none; color:rgba(255,255,255,0.25); font-size:13px; font-family:'Poppins',sans-serif; cursor:pointer; transition:color 0.2s; }
        .ps-skip-btn:hover { color:rgba(255,255,255,0.5); }
      `}</style>

      <div className="ps-root">

        {/* Top bar */}
        <div className="ps-topbar">
          <div className="ps-logo">Study<span>Match</span></div>
          <div className="ps-step-label">Step {step} of {STEPS.length}</div>
        </div>

        <div className="ps-content">

          {/* Heading */}
          <div className="ps-heading">
            <div className="ps-title">Profile Setup</div>
            <div className="ps-sub">Let's build your profile to help you find the right study partners.</div>
          </div>

          {/* Step indicators */}
          <div className="ps-steps">
            {STEPS.map(s => {
              const state = s.num < step ? 'done' : s.num === step ? 'active' : 'pending'
              return (
                <div key={s.num} className={`ps-step-item ${state}`}>
                  <div className={`ps-step-circle ${state}`}>
                    {state === 'done' ? <Check size={14} /> : s.num}
                  </div>
                  <span className={`ps-step-name ${state}`}>{s.label}</span>
                </div>
              )
            })}
          </div>

          {/* Error */}
          {errors.general && <div className="ps-general-error">{errors.general}</div>}

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <>
              {/* Profile picture */}
              <div className="ps-card">
                <div className="ps-card-title">Profile Picture</div>
                <div className="ps-card-sub">Add a photo so others can recognize you.</div>
                <div className="ps-photo-wrap">
                  <div className="ps-photo-circle">
                    <Camera size={24} />
                  </div>
                  <div>
                    <button type="button" className="ps-photo-upload-btn">
                      <Upload size={14} /> Upload Photo
                    </button>
                    <div className="ps-photo-hint">JPG, PNG or GIF. Max size 5MB.</div>
                  </div>
                  <div className="ps-photo-tip">
                    ✨ A clear profile picture helps build trust and makes it easier to connect!
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="ps-card">
                <div className="ps-card-title">Basic Information</div>
                <div className="ps-card-sub">Tell us the basics about you.</div>
                <div className="ps-grid" style={{ marginBottom: 14 }}>
                  <div className="ps-field">
                    <label className="ps-label">Full Name</label>
                    <input className="ps-input" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Test Student" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">School / University</label>
                    <input className="ps-input" name="institution" value={formData.institution} onChange={handleChange} placeholder="Example University" />
                    {errors.institution && <div className="ps-error">{errors.institution[0]}</div>}
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Course / Major</label>
                    <input className="ps-input" name="course" value={formData.course} onChange={handleChange} placeholder="Computer Science" />
                    {errors.course && <div className="ps-error">{errors.course[0]}</div>}
                  </div>
                </div>
                <div className="ps-grid-2">
                  <div className="ps-field">
                    <label className="ps-label">Year of Study</label>
                    <select className="ps-select" name="year_of_study" value={formData.year_of_study} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">Select year...</option>
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>{yearLabel(y)}</option>)}
                    </select>
                    {errors.year_of_study && <div className="ps-error">{errors.year_of_study[0]}</div>}
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Location (Optional)</label>
                    <input className="ps-input" name="location" value={formData.location} onChange={handleChange} placeholder="New York, USA" />
                  </div>
                </div>
              </div>

              {/* Short bio */}
              <div className="ps-card">
                <div className="ps-card-title">Short Bio</div>
                <div className="ps-card-sub">Write a short introduction about yourself.</div>
                <textarea className="ps-textarea" name="bio" value={formData.bio} onChange={handleChange}
                  placeholder="Add a few lines about yourself, your interests, and what you're looking for on StudyMatch..."
                  maxLength={200} />
                <div className="ps-char-count">{formData.bio.length}/200</div>
              </div>
            </>
          )}

          {/* ── Step 2: About You ── */}
          {step === 2 && (
            <div className="ps-card">
              <div className="ps-card-title">About You</div>
              <div className="ps-card-sub">Tell study partners more about yourself.</div>
              <div className="ps-grid-2" style={{ marginBottom: 16 }}>
                <div className="ps-field">
                  <label className="ps-label">Gender (Optional)</label>
                  <select className="ps-select" name="gender" value={formData.gender} onChange={handleChange}
                    style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="ps-field">
                  <label className="ps-label">Date of Birth (Optional)</label>
                  <input className="ps-input" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                </div>
                <div className="ps-field">
                  <label className="ps-label">Phone (Optional)</label>
                  <input className="ps-input" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1234567890" />
                </div>
              </div>
              <div className="ps-field">
                <label className="ps-label">Full Bio (Optional)</label>
                <textarea className="ps-textarea" style={{ height: 130 }} name="bio" value={formData.bio} onChange={handleChange}
                  placeholder="I'm a computer science student who loves problem solving and helping others understand complex topics..."
                  maxLength={500} />
                <div className="ps-char-count">{formData.bio.length}/500</div>
              </div>
            </div>
          )}

          {/* ── Step 3: Study Goals ── */}
          {step === 3 && (
            <div className="ps-card">
              <div className="ps-card-title">Study Goals</div>
              <div className="ps-card-sub">What do you want to achieve? Select all that apply.</div>
              <div className="ps-tags-grid">
                {STUDY_GOALS.map(g => (
                  <button key={g} type="button"
                    className={`ps-tag-btn${formData.study_goals.includes(g) ? ' selected' : ''}`}
                    onClick={() => toggleArr('study_goals', g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Subjects ── */}
          {step === 4 && (
            <div className="ps-card">
              <div className="ps-card-title">Study Subjects</div>
              <div className="ps-card-sub">Select the subjects you study or need help with.</div>
              <div className="ps-tags-grid">
                {SUBJECTS.map(s => (
                  <button key={s} type="button"
                    className={`ps-tag-btn${formData.study_subjects.includes(s) ? ' selected' : ''}`}
                    onClick={() => toggleArr('study_subjects', s)}>
                    {s}
                  </button>
                ))}
              </div>
              {errors.study_subjects && <div className="ps-error" style={{ marginTop: 10 }}>{errors.study_subjects[0]}</div>}
            </div>
          )}

          {/* ── Step 5: Preferences ── */}
          {step === 5 && (
            <>
              <div className="ps-card">
                <div className="ps-card-title">Study Preferences</div>
                <div className="ps-card-sub">How do you like to study?</div>
                <div className="ps-grid-2">
                  <div className="ps-field">
                    <label className="ps-label">Preferred Study Time</label>
                    <select className="ps-select" name="preferred_study_time" value={formData.preferred_study_time} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">Select...</option>
                      <option value="morning">Morning (6AM – 12PM)</option>
                      <option value="afternoon">Afternoon (12PM – 6PM)</option>
                      <option value="evening">Evening (6PM – 10PM)</option>
                      <option value="night">Night (10PM – 2AM)</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Study Location</label>
                    <select className="ps-select" name="study_location_preference" value={formData.study_location_preference} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">Select...</option>
                      <option value="library">Library</option>
                      <option value="cafe">Cafe</option>
                      <option value="online">Online</option>
                      <option value="home">Home</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Learning Style</label>
                    <select className="ps-select" name="learning_style" value={formData.learning_style} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">Select...</option>
                      <option value="visual">Visual</option>
                      <option value="auditory">Auditory</option>
                      <option value="kinesthetic">Kinesthetic</option>
                      <option value="reading_writing">Reading/Writing</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ps-card">
                <div className="ps-card-title">Partner Matching</div>
                <div className="ps-card-sub">What are you looking for in a study partner?</div>
                <div className="ps-grid-2">
                  <div className="ps-field">
                    <label className="ps-label">Partner Gender Preference</label>
                    <select className="ps-select" name="partner_gender_preference" value={formData.partner_gender_preference} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">No preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Partner Year Preference</label>
                    <select className="ps-select" name="partner_year_preference" value={formData.partner_year_preference} onChange={handleChange}
                      style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                      <option value="">No preference</option>
                      <option value="same">Same year as me</option>
                      <option value="similar">Similar year (±1)</option>
                      <option value="any">Any year</option>
                    </select>
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">Maximum Active Partners</label>
                    <input className="ps-input" type="number" name="max_partners" value={formData.max_partners} onChange={handleChange} min="1" max="10" />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>How many study partners? (1–10)</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 6: Availability ── */}
          {step === 6 && (
            <div className="ps-card">
              <div className="ps-card-title">Availability</div>
              <div className="ps-card-sub">When are you usually free to study?</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Day</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Start Time</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>End Time</div>
                </div>
                {[
                  { key: 'weekdays', label: 'Monday – Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday',   label: 'Sunday' },
                ].map(r => (
                  <div key={r.key} className="ps-avail-row">
                    <span className="ps-avail-day">{r.label}</span>
                    <input className="ps-input" type="time"
                      value={formData.availability[r.key]?.split('-')[0] || ''}
                      onChange={e => {
                        const end = formData.availability[r.key]?.split('-')[1] || ''
                        handleAvailChange(r.key, `${e.target.value}-${end}`)
                      }} />
                    <input className="ps-input" type="time"
                      value={formData.availability[r.key]?.split('-')[1] || ''}
                      onChange={e => {
                        const start = formData.availability[r.key]?.split('-')[0] || ''
                        handleAvailChange(r.key, `${start}-${e.target.value}`)
                      }} />
                  </div>
                ))}
              </div>

              <div className="ps-field">
                <label className="ps-label">Time Zone</label>
                <select className="ps-select" style={{ backgroundImage: svgArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', maxWidth: 320 }}
                  value={formData.availability.timezone}
                  onChange={e => handleAvailChange('timezone', e.target.value)}>
                  <option value="">Select timezone...</option>
                  <option value="UTC-8">PST (UTC-8)</option>
                  <option value="UTC-7">MST (UTC-7)</option>
                  <option value="UTC-6">CST (UTC-6)</option>
                  <option value="UTC-5">EST (UTC-5)</option>
                  <option value="UTC+0">GMT (UTC+0)</option>
                  <option value="UTC+8">PHT (UTC+8)</option>
                  <option value="UTC+9">JST (UTC+9)</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Bottom nav */}
        <div className="ps-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {step > 1 && (
              <button className="ps-back-btn" onClick={() => setStep(s => s - 1)} disabled={loading}>
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step === 1 && <div />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="ps-skip-btn" onClick={handleSkip}>Skip</button>
            <button className="ps-next-btn" onClick={handleNext} disabled={loading}>
              {loading ? 'Saving...' : step === 6 ? 'Complete Setup' : 'Next'}
              {!loading && step < 6 && <ArrowRight size={14} />}
              {!loading && step === 6 && <Check size={14} />}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}