import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { register, sendOtp, verifyOtp } from '../../api/auth'
import { saveAuth } from '../../store/authStore'
import { updateProfileStep1, updateProfileStep2, completeProfile } from '../../api/profile'
import {
  User, Mail, Lock, Eye, EyeOff, GraduationCap, Check,
  Zap, Monitor, MapPin, Globe, Sun, Coffee, Moon, Users,
  Headphones, Hand, Bell, BookOpen, FileText, Send
} from 'lucide-react'
import logo    from '../../assets/logo.png'
import bgImage from '../../assets/background.png'

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Statistics','Programming','Data Structures','Algorithms','History','Economics','Psychology','Philosophy','Literature','Calculus','Linear Algebra','Discrete Math','Networking']
const COURSES = ['Computer Science','Information Technology','Engineering','Business Administration','Education','Nursing','Medicine','Architecture','Accountancy','Psychology','Law','Other']
const YEAR_LEVELS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year','Graduate']
const DEPARTMENTS = ['Department of Mathematics','Department of Science','Department of English','Department of Computer Science','Department of Engineering','Department of Business','Department of Education','Department of Nursing','Other']
const POSITIONS = ['Junior High School Faculty','Senior High School Faculty','College Instructor','College Professor','Department Head','Other']
const EXPERIENCE_LEVELS = ['Less than 1 year','1-3 years','3-5 years','5-10 years','10+ years']
const ATTAINMENTS = ["Bachelor's Degree","Master's Degree","Doctorate (PhD)",'Professional License','Other']
const TUTOR_SUBJECTS = ['Mathematics','Statistics','Physics','Chemistry','Biology','English','Filipino','History','Social Studies','Computer Science','Programming','Engineering','Business','Accounting']
const GRADE_LEVELS = ['Junior High School','Senior High School','College / University']
const TUTORING_STYLES = ['Lecture-based','Interactive & Discussion-based','Problem-solving focused','Project-based','Socratic method','Mixed / Adaptive']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const STUDENT_STEPS = ['Account','Verify','Details','Finish']
const TUTOR_STEPS = ['Account','Academic','Verification','Tutoring','Review']
const svgArrow = `url("data:image/svg+xml,%3Csvg width='11' height='7' viewBox='0 0 11 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5.5 6L10 1' stroke='%23ffffff44' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

const Tag = ({ label, onRemove, color = 'purple' }) => {
  const c = { purple:{ bg:'rgba(124,92,250,0.15)',border:'rgba(124,92,250,0.35)',text:'#c4b8ff' }, pink:{ bg:'rgba(236,72,153,0.1)',border:'rgba(236,72,153,0.3)',text:'#f9a8d4' } }[color] || { bg:'rgba(124,92,250,0.15)',border:'rgba(124,92,250,0.35)',text:'#c4b8ff' }
  return <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,background:c.bg,border:`1px solid ${c.border}`,color:c.text }}>{label}{onRemove&&<button onClick={onRemove} style={{ background:'none',border:'none',color:'inherit',opacity:0.6,cursor:'pointer',fontSize:13,lineHeight:1,display:'flex',alignItems:'center',padding:0 }}>x</button>}</span>
}

const HStepBar = ({ steps, current }) => (
  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'center',gap:0,marginBottom:18 }}>
    {steps.map((s, i) => {
      const done = current > i+1; const active = current === i+1
      return (
        <div key={s} style={{ display:'flex',alignItems:'center',flex:i<steps.length-1?1:'none' }}>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5,minWidth:56 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,background:(done||active)?'#7c5cfa':'rgba(255,255,255,0.06)',color:(done||active)?'#fff':'rgba(255,255,255,0.25)',border:(done||active)?'none':'1px solid rgba(255,255,255,0.12)',boxShadow:active?'0 0 0 3px rgba(124,92,250,0.25)':'none',transition:'all 0.3s' }}>
              {done?<Check size={13}/>:i+1}
            </div>
            <span style={{ fontSize:10,fontWeight:500,whiteSpace:'nowrap',color:(done||active)?'#c4b8ff':'rgba(255,255,255,0.22)',textAlign:'center' }}>{s}</span>
          </div>
          {i<steps.length-1&&<div style={{ flex:1,height:1,background:done?'#7c5cfa':'rgba(255,255,255,0.1)',marginBottom:20,marginLeft:2,marginRight:2,transition:'background 0.3s' }}/>}
        </div>
      )
    })}
  </div>
)

const UploadRow = ({ label, required }) => {
  const [file,setFile]=useState(null)
  return (
    <div style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 13px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(120,90,240,0.15)',borderRadius:10 }}>
      <div style={{ width:30,height:30,borderRadius:8,background:'rgba(124,92,250,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><FileText size={13} color="#a78bfa"/></div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12,fontWeight:600,color:'#ddd8ff' }}>{label}</div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:1 }}>{required?'Required':'Optional'}</div>
        {file&&<div style={{ fontSize:10,color:'#4ade80',marginTop:1 }}>checkmark {file.name}</div>}
      </div>
      <label style={{ padding:'5px 12px',borderRadius:7,background:'rgba(124,92,250,0.12)',border:'1px solid rgba(124,92,250,0.25)',color:'#a78bfa',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' }}>
        {file?'Change':'Upload'}
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0])}/>
      </label>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [role,setRole]=useState(null)
  const [step,setStep]=useState(0)
  const [formData,setFormData]=useState({ name:'',email:'',password:'',password_confirmation:'' })
  const [showPw,setShowPw]=useState(false); const [showCpw,setShowCpw]=useState(false)
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
  const [registered,setRegistered]=useState(false); const [registeredEmail,setRegisteredEmail]=useState('')
  const [otp,setOtp]=useState(['','','','','','']); const [resendTimer,setResendTimer]=useState(0)
  const otpRefs=useRef([])
  const [bio,setBio]=useState(''); const [course,setCourse]=useState(''); const [yearLevel,setYearLevel]=useState('')
  const [goodAt,setGoodAt]=useState([]); const [needHelp,setNeedHelp]=useState([])
  const [addingGood,setAddingGood]=useState(false); const [addingHelp,setAddingHelp]=useState(false)
  const [lStyle,setLStyle]=useState([]); const [avail,setAvail]=useState([]); const [sSetup,setSSetup]=useState('')
  const [notifA,setNotifA]=useState(true); const [notifB,setNotifB]=useState(true)
  const [tDept,setTDept]=useState(''); const [tPos,setTPos]=useState(''); const [tEmpId,setTEmpId]=useState('')
  const [tExp,setTExp]=useState(''); const [tAtt,setTAtt]=useState('')
  const [tSubs,setTSubs]=useState([]); const [tAddSubs,setTAddSubs]=useState(false); const [tLic,setTLic]=useState('')
  const [tGrades,setTGrades]=useState([]); const [tDays,setTDays]=useState([])
  const [tFrom,setTFrom]=useState('08:00 AM'); const [tTo,setTTo]=useState('05:00 PM')
  const [tStyle,setTStyle]=useState(''); const [tMode,setTMode]=useState(''); const [tOk,setTOk]=useState(false)

  useEffect(()=>{ if(resendTimer<=0)return; const t=setTimeout(()=>setResendTimer(s=>s-1),1000); return()=>clearTimeout(t) },[resendTimer])

  const hc=e=>setFormData({...formData,[e.target.name]:e.target.value})
  const tog=(arr,setArr,v)=>setArr(arr.includes(v)?arr.filter(x=>x!==v):[...arr,v])
  const hotp=(i,v)=>{ if(!/^\d?$/.test(v))return; const n=[...otp];n[i]=v;setOtp(n);if(v&&i<5)otpRefs.current[i+1]?.focus() }
  const hotpK=(i,e)=>{ if(e.key==='Backspace'&&!otp[i]&&i>0)otpRefs.current[i-1]?.focus() }
  const hotpP=e=>{ const p=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);if(!p)return;setOtp([...p.split(''),...Array(6-p.length).fill('')]);otpRefs.current[Math.min(p.length,5)]?.focus();e.preventDefault() }

  const v1=()=>{ if(!formData.name.trim())return'Please enter your full name.';if(!formData.email.trim())return'Please enter your email.';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))return'Please enter a valid email.';if(!formData.password)return'Please enter a password.';if(formData.password.length<8)return'Password must be at least 8 characters.';if(formData.password!==formData.password_confirmation)return'Passwords do not match.';return null }

  const handleNext=async()=>{
    setError('')
    if(step===1){ const err=v1();if(err){setError(err);return};setLoading(true);if(registered&&registeredEmail===formData.email){try{await sendOtp();setResendTimer(60);setStep(2)}catch(e){setError(e.response?.data?.message||'Failed to resend verification code.')}finally{setLoading(false)};return};try{const res=await register({...formData,role:role==='tutor'?'tutor':'student'});saveAuth(res.data.token,res.data.user);setRegistered(true);setRegisteredEmail(formData.email);setResendTimer(60);setStep(2)}catch(e){setError(e.response?.data?.message||'Registration failed.')}finally{setLoading(false)};return }
    if(step===2){ const code=otp.join('');if(code.length<6){setError('Please enter the 6-digit code.');return};setLoading(true);try{await verifyOtp(code);setStep(3)}catch(e){setError(e.response?.data?.message||'Invalid or expired code.')}finally{setLoading(false)};return }
    setStep(s=>s+1)
  }
  const handleBack=()=>{ setError('');if(step===1)setStep(0);else setStep(s=>s-1) }
  const handleResend=async()=>{ if(resendTimer>0)return;setError('');setLoading(true);try{await sendOtp({email:formData.email});setResendTimer(60);setOtp(['','','','','','']);otpRefs.current[0]?.focus()}catch(e){setError(e.response?.data?.message||'Failed to resend.')}finally{setLoading(false)} }

  const YEAR_MAP = {'1st Year':'1st','2nd Year':'2nd','3rd Year':'3rd','4th Year':'4th','5th Year':'5th','Graduate':'5th'}

  const handleStudentFinish = async () => {
    setLoading(true)
    try {
      await updateProfileStep1({ name: formData.name, bio })
      await updateProfileStep2({ program: course, year_level: YEAR_MAP[yearLevel] || null })
      await completeProfile()
    } catch(e) {}
    finally { setLoading(false) }
    navigate('/student/dashboard')
  }

  const handleTutorSubmit = async () => {
    if (!tOk) return
    setLoading(true)
    try {
      await updateProfileStep2({ position: tPos, employee_id: tEmpId, specialization: tDept })
      await completeProfile()
    } catch(e) {}
    finally { setLoading(false) }
    setStep(6)
  }

  const steps=role==='tutor'?TUTOR_STEPS:STUDENT_STEPS
  const isWide=role==='tutor'&&step>=3&&step<=5
  const isMedium=role==='student'&&step===3

  const BG = `url(${bgImage})`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        html,body,#root{height:100%;margin:0;padding:0;overflow:hidden;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .rp-root{height:100vh;width:100vw;font-family:'Poppins',sans-serif;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .rp-bg{position:absolute;inset:0;background:${BG} right center/contain no-repeat,#0a0818;z-index:0;}
        .rp-ov{position:absolute;inset:0;background:linear-gradient(100deg,rgba(5,4,16,0.93) 0%,rgba(5,4,16,0.75) 40%,rgba(5,4,16,0.4) 100%);z-index:1;}
        .rp-tn{position:absolute;inset:0;background:linear-gradient(100deg,rgba(40,15,100,0.22) 0%,rgba(40,15,100,0.06) 36%,transparent 60%);z-index:2;}
        .rp-card{position:relative;z-index:10;width:480px;max-height:96vh;background:rgba(8,6,24,0.58);border:1px solid rgba(120,90,240,0.2);border-radius:22px;backdrop-filter:blur(24px);display:flex;flex-direction:column;animation:cIn 0.4s cubic-bezier(0.22,1,0.36,1) both;overflow:hidden;transition:width 0.3s;}
        .rp-card.md{width:680px;} .rp-card.lg{width:880px;}
        @keyframes cIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .rp-logo-row{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px 36px 0;}
        .rp-logo-img{width:32px;height:32px;filter:drop-shadow(0 0 10px rgba(124,92,250,0.5));}
        .rp-logo-img img{width:100%;height:100%;object-fit:contain;}
        .rp-logo-txt{font-size:22px;font-weight:700;color:#eae6ff;letter-spacing:-0.3px;}
        .rp-logo-txt span{color:#7c5cfa;}
        .rp-steps-area{padding:14px 36px 0;}
        .rp-title-area{padding:8px 36px 0;}
        .rp-title{font-size:20px;font-weight:700;color:#eae6ff;margin-bottom:3px;}
        .rp-sub{font-size:12px;color:rgba(255,255,255,0.32);}
        .rp-err-wrap{padding:8px 36px 0;}
        .rp-err{padding:9px 13px;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.28);border-radius:10px;color:#fca5a5;font-size:13px;}
        .rp-body{flex:1;overflow-y:auto;min-height:0;padding:14px 36px 18px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(124,92,250,0.3) transparent;}
        .rp-body::-webkit-scrollbar{width:4px;} .rp-body::-webkit-scrollbar-thumb{background:rgba(124,92,250,0.3);border-radius:4px;}
        .rp-field{position:relative;display:flex;align-items:center;}
        .rp-ico{position:absolute;left:14px;color:rgba(255,255,255,0.2);display:flex;pointer-events:none;z-index:1;}
        .rp-inp{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(120,90,240,0.18);border-radius:11px;color:#ddd8ff;font-size:13px;font-family:'Poppins',sans-serif;padding:12px 14px 12px 44px;outline:none;transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;-webkit-appearance:none;appearance:none;}
        .rp-inp:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px rgba(124,92,250,0.07) inset !important;-webkit-text-fill-color:#ddd8ff !important;border-color:rgba(124,92,250,0.5) !important;}
        .rp-inp::placeholder{color:rgba(255,255,255,0.18);} .rp-inp:focus{border-color:rgba(124,92,250,0.55);background:rgba(124,92,250,0.07);box-shadow:0 0 0 3px rgba(124,92,250,0.1);}
        .rp-inp option{background:#120f2e;color:#ddd8ff;}
        .rp-eye{position:absolute;right:13px;background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;padding:4px;display:flex;align-items:center;transition:color 0.2s;} .rp-eye:hover{color:rgba(255,255,255,0.5);}
        .rp-otp-hint{font-size:13px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.7;} .rp-otp-hint strong{color:#c4b8ff;font-weight:600;}
        .rp-otp-boxes{display:flex;gap:8px;justify-content:center;}
        .rp-otp-box{width:50px;height:56px;background:rgba(255,255,255,0.05);border:1px solid rgba(120,90,240,0.2);border-radius:11px;color:#ddd8ff;font-size:20px;font-weight:700;font-family:'Poppins',sans-serif;text-align:center;outline:none;caret-color:#7c5cfa;transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;}
        .rp-otp-box:focus{border-color:rgba(124,92,250,0.7);background:rgba(124,92,250,0.09);box-shadow:0 0 0 3px rgba(124,92,250,0.15);} .rp-otp-box.f{border-color:rgba(124,92,250,0.5);color:#fff;}
        .rp-resend{text-align:center;font-size:13px;color:rgba(255,255,255,0.28);}
        .rp-resend button{background:none;border:none;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;padding:0;margin-left:4px;transition:color 0.2s;}
        .rp-resend button.can{color:#7c5cfa;} .rp-resend button.can:hover{color:#a78bfa;} .rp-resend button.no{color:rgba(255,255,255,0.2);cursor:not-allowed;}
        .role-card{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 12px;border-radius:14px;border:2px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;transition:all 0.2s;text-align:center;position:relative;}
        .role-card:hover{border-color:rgba(124,92,250,0.4);background:rgba(124,92,250,0.07);}
        .role-card.sel{border-color:#7c5cfa;background:rgba(124,92,250,0.13);box-shadow:0 0 0 3px rgba(124,92,250,0.15);}
        .role-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(124,92,250,0.12);color:#a78bfa;margin-bottom:2px;}
        .role-title{font-size:14px;font-weight:700;color:#ddd8ff;} .role-sub{font-size:11px;color:rgba(255,255,255,0.3);line-height:1.4;}
        .fm-lbl{font-size:11px;color:rgba(255,255,255,0.3);font-weight:500;margin-bottom:3px;display:block;}
        .fm-sel{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(120,90,240,0.18);border-radius:10px;color:#ddd8ff;font-size:13px;font-family:'Poppins',sans-serif;padding:9px 30px 9px 11px;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;background-repeat:no-repeat;background-position:right 10px center;transition:border-color 0.2s;}
        .fm-sel:focus{border-color:rgba(124,92,250,0.55);} .fm-sel option{background:#120f2e;color:#ddd8ff;}
        .fm-inp{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(120,90,240,0.18);border-radius:10px;color:#ddd8ff;font-size:13px;font-family:'Poppins',sans-serif;padding:9px 11px;outline:none;transition:border-color 0.2s;}
        .fm-inp:focus{border-color:rgba(124,92,250,0.55);background:rgba(124,92,250,0.06);} .fm-inp::placeholder{color:rgba(255,255,255,0.15);}
        .fm-grp{display:flex;flex-direction:column;gap:4px;}
        .sd-picker{background:rgba(10,8,28,0.97);border:1px solid rgba(124,92,250,0.25);border-radius:10px;padding:6px;display:flex;flex-wrap:wrap;gap:5px;max-height:80px;overflow-y:auto;}
        .sd-picker::-webkit-scrollbar{width:4px;} .sd-picker::-webkit-scrollbar-thumb{background:rgba(124,92,250,0.3);border-radius:4px;}
        .sd-pi{padding:3px 9px;border-radius:16px;font-size:11px;font-family:'Poppins',sans-serif;font-weight:500;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);transition:all 0.15s;}
        .sd-pi:hover{background:rgba(124,92,250,0.15);border-color:rgba(124,92,250,0.4);color:#c4b8ff;}
        .mode-row{display:flex;gap:6px;}
        .mode-btn{flex:1;padding:8px 4px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;text-align:center;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:4px;}
        .mode-btn.on{border-color:#7c5cfa;background:rgba(124,92,250,0.16);color:#c4b8ff;}
        .day-row{display:flex;gap:5px;flex-wrap:wrap;}
        .day-btn{padding:5px 8px;border-radius:7px;font-size:11px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);transition:all 0.15s;}
        .day-btn.on{background:rgba(124,92,250,0.18);border-color:rgba(124,92,250,0.4);color:#c4b8ff;}
        .grade-btn{display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:9px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:12px;font-weight:500;font-family:'Poppins',sans-serif;cursor:pointer;transition:all 0.2s;margin-bottom:5px;}
        .grade-btn.on{border-color:#7c5cfa;background:rgba(124,92,250,0.12);color:#c4b8ff;}
        .rv-card{background:rgba(255,255,255,0.03);border:1px solid rgba(120,90,240,0.14);border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;}
        .rv-icon{width:32px;height:32px;border-radius:8px;background:rgba(124,92,250,0.1);display:flex;align-items:center;justify-content:center;color:#a78bfa;flex-shrink:0;}
        .rv-title{font-size:12px;font-weight:700;color:#ddd8ff;margin-bottom:4px;}
        .rv-row{font-size:11px;color:rgba(255,255,255,0.38);line-height:1.6;}
        .rv-edit{font-size:11px;color:#7c5cfa;font-weight:600;background:none;border:none;cursor:pointer;font-family:'Poppins',sans-serif;padding:0;}
        .cfm-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:rgba(124,92,250,0.06);border:1px solid rgba(124,92,250,0.15);border-radius:10px;cursor:pointer;}
        .cfm-box{width:17px;height:17px;border-radius:4px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(124,92,250,0.4);background:rgba(255,255,255,0.03);transition:all 0.2s;}
        .cfm-box.on{background:#7c5cfa;border-color:#7c5cfa;}
        .cfm-text{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5;}
        .nf-card{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(120,90,240,0.15);border-radius:12px;cursor:pointer;transition:all 0.2s;}
        .nf-card.on{border-color:rgba(124,92,250,0.3);}
        .nf-icon{width:32px;height:32px;border-radius:8px;background:rgba(124,92,250,0.12);display:flex;align-items:center;justify-content:center;color:#a78bfa;flex-shrink:0;}
        .nf-chk{width:19px;height:19px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
        .nf-chk.on{background:#7c5cfa;} .nf-chk.off{background:rgba(255,255,255,0.03);border:1.5px solid rgba(124,92,250,0.3);}
        .rp-footer{padding:0 36px 18px;display:flex;flex-direction:column;gap:8px;flex-shrink:0;}
        .rp-btn{width:100%;padding:13px;background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);color:#fff;border:none;border-radius:11px;font-size:15px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;}
        .rp-btn:hover:not(:disabled){opacity:0.91;transform:translateY(-1px);box-shadow:0 8px 24px rgba(124,92,250,0.38);} .rp-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .rp-btn-row{display:flex;gap:9px;}
        .rp-btn-bk{flex:0 0 auto;padding:13px 18px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:11px;font-size:14px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;transition:background 0.2s,color 0.2s;display:flex;align-items:center;gap:5px;}
        .rp-btn-bk:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.7);}
        .rp-link{font-size:12px;color:rgba(255,255,255,0.25);text-align:center;}
        .rp-link a{color:#7c5cfa;text-decoration:none;font-weight:600;}
        .sec-t{font-size:10px;font-weight:700;color:#c4b8ff;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;display:flex;align-items:center;gap:5px;}
        .add-tag-btn{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;font-family:'Poppins',sans-serif;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.15);color:rgba(255,255,255,0.3);cursor:pointer;transition:all 0.2s;}
        .add-tag-btn:hover{border-color:rgba(124,92,250,0.4);color:#7c5cfa;}
      `}</style>

      <div className="rp-root">
        <div className="rp-bg"/><div className="rp-ov"/><div className="rp-tn"/>

        {/* Submitted */}
        {role==='tutor'&&step===6&&(
          <div style={{ position:'relative',zIndex:10,width:440,background:'rgba(8,6,24,0.6)',border:'1px solid rgba(120,90,240,0.22)',borderRadius:24,backdropFilter:'blur(24px)',padding:36,display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center',fontFamily:'Poppins,sans-serif',color:'#ddd8ff' }}>
            <div style={{ display:'flex',gap:6,justifyContent:'center' }}>{['#7c5cfa','#fbbf24','#4ade80','#f472b6'].map((c,i)=><div key={i} style={{ width:7,height:7,borderRadius:'50%',background:c,opacity:0.7 }}/>)}</div>
            <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(124,92,250,0.15)',border:'2px solid rgba(124,92,250,0.35)',display:'flex',alignItems:'center',justifyContent:'center',color:'#7c5cfa' }}><Check size={32}/></div>
            <div style={{ fontSize:20,fontWeight:700,color:'#eae6ff' }}>You're all set!</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.35)',lineHeight:1.7 }}>Your tutor profile has been created and is now active.<br/>Students can find and send you requests right away.</div>
            <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(120,90,240,0.15)',borderRadius:12,padding:'14px 18px',width:'100%',textAlign:'left' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <span style={{ fontSize:13,fontWeight:600,color:'#ddd8ff' }}>Status</span>
                <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700,background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.3)',color:'#4ade80' }}>Active</span>
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',lineHeight:1.7 }}>Complete your profile to attract more students.<br/><span style={{ color:'rgba(255,255,255,0.25)' }}>Add your subjects, availability, and bio from your dashboard.</span></div>
            </div>
            <button style={{ width:'100%',padding:13,background:'linear-gradient(135deg,#7c5cfa,#5738d0)',color:'#fff',border:'none',borderRadius:11,fontSize:14,fontWeight:600,fontFamily:'Poppins,sans-serif',cursor:'pointer' }} onClick={()=>navigate('/tutor/dashboard')}>Go to Dashboard</button>
          </div>
        )}

        {step<6&&(
          <div className={`rp-card${isWide?' lg':isMedium?' md':''}`}>
            {/* Logo */}
            <div className="rp-logo-row">
              <div className="rp-logo-img"><img src={logo} alt=""/></div>
              <div className="rp-logo-txt">Study<span>Match</span></div>
            </div>

            {/* Step bar */}
            {step>=1&&<div className="rp-steps-area"><HStepBar steps={steps} current={step}/></div>}

            {/* Title */}
            <div className="rp-title-area">
              {step===0&&<><div style={{ textAlign:'center',marginBottom:6 }}><span style={{ display:'inline-block',padding:'3px 12px',borderRadius:20,background:'rgba(124,92,250,0.15)',border:'1px solid rgba(124,92,250,0.25)',fontSize:12,color:'#c4b8ff' }}>Welcome to StudyMatch!</span></div><div className="rp-title" style={{ textAlign:'center' }}>Create your account</div><div className="rp-sub" style={{ textAlign:'center' }}>Join our learning community and start your journey.</div></>}
              {step===1&&<><div className="rp-title">Create your account</div><div className="rp-sub">Step 1 of {steps.length}</div></>}
              {step===2&&<><div className="rp-title">Verify your email</div><div className="rp-sub">Step 2 of {steps.length}</div></>}
              {role==='student'&&step===3&&<><div className="rp-title">Tell us about yourself</div><div className="rp-sub">Step 3 of 4</div></>}
              {role==='student'&&step===4&&<><div className="rp-title">You're almost there!</div><div className="rp-sub">Step 4 of 4</div></>}
              {role==='tutor'&&step===3&&<><div className="rp-title">Academic Information</div><div className="rp-sub">Step 2 of 5</div></>}
              {role==='tutor'&&step===4&&<><div className="rp-title">Verification Documents</div><div className="rp-sub">Step 3 of 5</div></>}
              {role==='tutor'&&step===5&&<><div className="rp-title">Tutoring Details</div><div className="rp-sub">Step 4 of 5</div></>}
            </div>

            {error&&<div className="rp-err-wrap"><div className="rp-err">{error}</div></div>}

            <div className="rp-body">
              {/* Step 0: Role */}
              {step===0&&(
                <>
                  <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',textAlign:'center' }}>I want to register as</div>
                  <div style={{ display:'flex',gap:12 }}>
                    <div className="role-card" onClick={()=>{setRole('student');setStep(1)}}>
                      <div className="role-icon"><GraduationCap size={24}/></div>
                      <div className="role-title">I'm a Student</div>
                      <div className="role-sub">Learn and connect with tutors</div>
                    </div>
                    <div className="role-card" onClick={()=>{setRole('tutor');setStep(1)}}>
                      <div className="role-icon"><Users size={24}/></div>
                      <div className="role-title">I'm a Tutor</div>
                      <div className="role-sub">Teach and help students succeed</div>
                    </div>
                  </div>
                  <div className="rp-link">Already have an account? <NavLink to="/login">Log in</NavLink></div>
                </>
              )}

              {/* Step 1: Account */}
              {step===1&&(
                <>
                  <div className="rp-field"><span className="rp-ico"><User size={15}/></span><input className="rp-inp" type="text" name="name" placeholder="Full name" value={formData.name} onChange={hc}/></div>
                  <div className="rp-field"><span className="rp-ico"><Mail size={15}/></span><input className="rp-inp" type="email" name="email" placeholder="Email address" value={formData.email} onChange={hc}/></div>
                  <div className="rp-field"><span className="rp-ico"><Lock size={15}/></span><input className="rp-inp" type={showPw?'text':'password'} name="password" placeholder="Password" value={formData.password} onChange={hc} style={{ paddingRight:42 }}/><button type="button" className="rp-eye" onClick={()=>setShowPw(!showPw)}>{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button></div>
                  <div className="rp-field"><span className="rp-ico"><Lock size={15}/></span><input className="rp-inp" type={showCpw?'text':'password'} name="password_confirmation" placeholder="Confirm password" value={formData.password_confirmation} onChange={hc} style={{ paddingRight:42 }}/><button type="button" className="rp-eye" onClick={()=>setShowCpw(!showCpw)}>{showCpw?<EyeOff size={15}/>:<Eye size={15}/>}</button></div>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:9 }}>
                    <input type="checkbox" id="tc" defaultChecked style={{ marginTop:2,accentColor:'#7c5cfa' }}/>
                    <label htmlFor="tc" style={{ fontSize:12,color:'rgba(255,255,255,0.38)',lineHeight:1.5,cursor:'pointer' }}>I agree to the <a href="/terms" style={{ color:'#7c5cfa',textDecoration:'none' }}>Terms of Service</a> and <a href="/privacy" style={{ color:'#7c5cfa',textDecoration:'none' }}>Privacy Policy</a></label>
                  </div>
                </>
              )}

              {/* Step 2: OTP */}
              {step===2&&(
                <>
                  <div className="rp-otp-hint">We sent a 6-digit code to<br/><strong>{formData.email}</strong></div>
<div className="rp-otp-boxes" onPaste={hotpP}>{otp.map((d,i)=><input key={i} ref={el=>otpRefs.current[i]=el} className={`rp-otp-box${d?' f':''}`} type="text" inputMode="numeric" maxLength={1} value={d} onChange={e=>hotp(i,e.target.value)} onKeyDown={e=>hotpK(i,e)}/>)}</div>
                  <div className="rp-resend">Didn't receive it?<button className={resendTimer>0?'no':'can'} onClick={handleResend} disabled={resendTimer>0||loading}>{resendTimer>0?`Resend in ${resendTimer}s`:'Resend code'}</button></div>
                </>
              )}

              {/* Student Step 3 */}
              {step===3&&role==='student'&&(
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
                  <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                    <div><div className="sec-t"><User size={10}/>About You</div><textarea style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(120,90,240,0.18)',borderRadius:10,color:'#ddd8ff',fontSize:12,fontFamily:'Poppins,sans-serif',padding:'9px 11px',outline:'none',resize:'none',height:64 }} placeholder="Tell us about yourself..." maxLength={160} value={bio} onChange={e=>setBio(e.target.value)}/></div>
                    <div><div className="sec-t"><GraduationCap size={10}/>Academic Info</div>
                      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                        <div className="fm-grp"><label className="fm-lbl">Course</label><select className="fm-sel" value={course} onChange={e=>setCourse(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select course</option>{COURSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="fm-grp"><label className="fm-lbl">Year Level</label><select className="fm-sel" value={yearLevel} onChange={e=>setYearLevel(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select year</option>{YEAR_LEVELS.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
                        <div className="fm-grp"><label className="fm-lbl">Good at</label><div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:4 }}>{goodAt.map(s=><Tag key={s} label={s} onRemove={()=>setGoodAt(goodAt.filter(v=>v!==s))} color="purple"/>)}<button className="add-tag-btn" onClick={()=>{setAddingGood(!addingGood);setAddingHelp(false)}}>+ Add</button></div>{addingGood&&<div className="sd-picker">{SUBJECTS.filter(s=>!goodAt.includes(s)).map(s=><button key={s} className="sd-pi" onClick={()=>{setGoodAt([...goodAt,s]);setAddingGood(false)}}>{s}</button>)}</div>}</div>
                        <div className="fm-grp"><label className="fm-lbl">Need help with</label><div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:4 }}>{needHelp.map(s=><Tag key={s} label={s} onRemove={()=>setNeedHelp(needHelp.filter(v=>v!==s))} color="pink"/>)}<button className="add-tag-btn" onClick={()=>{setAddingHelp(!addingHelp);setAddingGood(false)}}>+ Add</button></div>{addingHelp&&<div className="sd-picker">{SUBJECTS.filter(s=>!needHelp.includes(s)).map(s=><button key={s} className="sd-pi" onClick={()=>{setNeedHelp([...needHelp,s]);setAddingHelp(false)}}>{s}</button>)}</div>}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                    <div className="sec-t"><Zap size={10}/>Study Preferences</div>
                    <div className="fm-grp"><label className="fm-lbl">Learning Style</label><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginTop:3 }}>{[{k:'visual',l:'Visual',I:Eye},{k:'auditory',l:'Auditory',I:Headphones},{k:'handson',l:'Hands-on',I:Hand},{k:'group',l:'Group Study',I:Users}].map(({k,l,I})=><button key={k} className={`mode-btn${lStyle.includes(k)?' on':''}`} onClick={()=>tog(lStyle,setLStyle,k)}><I size={12}/>{l}</button>)}</div></div>
                    <div className="fm-grp"><label className="fm-lbl">Availability</label><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginTop:3 }}>{[{k:'morning',l:'Morning',I:Sun},{k:'afternoon',l:'Afternoon',I:Coffee},{k:'evening',l:'Evening',I:Moon},{k:'night',l:'Night',I:Moon}].map(({k,l,I})=><button key={k} className={`mode-btn${avail.includes(k)?' on':''}`} onClick={()=>tog(avail,setAvail,k)}><I size={12}/>{l}</button>)}</div></div>
                    <div className="fm-grp"><label className="fm-lbl">Study Setup</label><div className="mode-row" style={{ marginTop:3 }}>{[{k:'online',l:'Online',I:Monitor},{k:'in-person',l:'In-Person',I:MapPin},{k:'either',l:'Either',I:Globe}].map(({k,l,I})=><button key={k} className={`mode-btn${sSetup===k?' on':''}`} onClick={()=>setSSetup(k)}><I size={12}/>{l}</button>)}</div></div>
                  </div>
                </div>
              )}

              {/* Student Step 4 */}
              {step===4&&role==='student'&&(
                <>
                  <div style={{ fontSize:13,color:'rgba(255,255,255,0.35)' }}>Let's set you up for success.</div>
                  {[{I:Bell,title:'StudyMatch updates',desc:'Get tips, study resources, and product updates.',on:notifA,t:()=>setNotifA(!notifA)},{I:Bell,title:'Important notifications',desc:'Receive important alerts about your account.',on:notifB,t:()=>setNotifB(!notifB)}].map(({I,title,desc,on,t})=>(
                    <div key={title} className={`nf-card${on?' on':''}`} onClick={t}>
                      <div className="nf-icon"><I size={16}/></div>
                      <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:'#ddd8ff',marginBottom:2 }}>{title}</div><div style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>{desc}</div></div>
                      <div className={`nf-chk${on?' on':' off'}`}>{on&&<Check size={11} color="#fff"/>}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Tutor Step 3: Academic */}
              {step===3&&role==='tutor'&&(
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                    <div className="fm-grp"><label className="fm-lbl">Department / Faculty</label><select className="fm-sel" value={tDept} onChange={e=>setTDept(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select department</option>{DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                    <div className="fm-grp"><label className="fm-lbl">Position</label><select className="fm-sel" value={tPos} onChange={e=>setTPos(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select position</option>{POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                    <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)',marginTop:2 }}>Professional Information</div>
                    <div className="fm-grp"><label className="fm-lbl">Employee ID</label><input className="fm-inp" placeholder="Employee ID / Faculty ID" value={tEmpId} onChange={e=>setTEmpId(e.target.value)}/></div>
                    <div className="fm-grp"><label className="fm-lbl">Years of Teaching Experience</label><select className="fm-sel" value={tExp} onChange={e=>setTExp(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select experience</option>{EXPERIENCE_LEVELS.map(e=><option key={e} value={e}>{e}</option>)}</select></div>
                    <div className="fm-grp"><label className="fm-lbl">Highest Educational Attainment</label><select className="fm-sel" value={tAtt} onChange={e=>setTAtt(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select attainment</option>{ATTAINMENTS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
                    <div className="fm-grp"><label className="fm-lbl">Subjects Handled</label><div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:4 }}>{tSubs.map(s=><Tag key={s} label={s} onRemove={()=>setTSubs(tSubs.filter(v=>v!==s))}/>)}<button className="add-tag-btn" onClick={()=>setTAddSubs(!tAddSubs)}>+ Add</button></div>{tAddSubs&&<div className="sd-picker">{TUTOR_SUBJECTS.filter(s=>!tSubs.includes(s)).map(s=><button key={s} className="sd-pi" onClick={()=>{setTSubs([...tSubs,s]);setTAddSubs(false)}}>{s}</button>)}</div>}<div style={{ fontSize:10,color:'rgba(255,255,255,0.2)',marginTop:2 }}>You can select multiple subjects</div></div>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.4)' }}>Optional</div>
                    <div className="fm-grp"><label className="fm-lbl">Teaching License Number</label><input className="fm-inp" placeholder="Teaching license number" value={tLic} onChange={e=>setTLic(e.target.value)}/></div>
                  </div>
                </div>
              )}

              {/* Tutor Step 4: Verification */}
              {step===4&&role==='tutor'&&(
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.5)',marginBottom:2 }}>Required Documents</div>
                    <UploadRow label="Faculty ID" required={true}/>
                    <UploadRow label="Employment Verification" required={true}/>
                    <UploadRow label="Teaching License" required={false}/>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.5)',marginBottom:2 }}>Optional Documents</div>
                    <UploadRow label="Certificates" required={false}/>
                    <UploadRow label="Awards" required={false}/>
                    <UploadRow label="Seminar / Training Certificates" required={false}/>
                  </div>
                  <div style={{ gridColumn:'1/-1',border:'1px dashed rgba(124,92,250,0.22)',borderRadius:12,padding:16,textAlign:'center',color:'rgba(255,255,255,0.22)',fontSize:12 }}>
                    <div style={{ fontSize:18,marginBottom:4 }}>cloud</div>
                    Drag and drop files here, or <span style={{ color:'#7c5cfa',cursor:'pointer' }}>click to browse</span><br/>
                    <span style={{ fontSize:10 }}>PDF, JPG, PNG. Max 10MB each</span>
                  </div>
                </div>
              )}

              {/* Tutor Step 5: Tutoring + Review */}
              {step===5&&role==='tutor'&&(
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#eae6ff' }}>Teaching Details</div>
                    <div className="fm-grp"><label className="fm-lbl">Subjects</label><div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>{tSubs.map(s=><Tag key={s} label={s} onRemove={()=>setTSubs(tSubs.filter(v=>v!==s))}/>)}<button className="add-tag-btn" onClick={()=>setTAddSubs(!tAddSubs)}>+ Add</button></div>{tAddSubs&&<div className="sd-picker">{TUTOR_SUBJECTS.filter(s=>!tSubs.includes(s)).map(s=><button key={s} className="sd-pi" onClick={()=>{setTSubs([...tSubs,s]);setTAddSubs(false)}}>{s}</button>)}</div>}</div>
                    <div className="fm-grp"><label className="fm-lbl">Grade Levels Taught</label>{GRADE_LEVELS.map(g=><button key={g} className={`grade-btn${tGrades.includes(g)?' on':''}`} onClick={()=>tog(tGrades,setTGrades,g)}><div style={{ width:13,height:13,borderRadius:3,border:`1.5px solid ${tGrades.includes(g)?'#7c5cfa':'rgba(255,255,255,0.2)'}`,background:tGrades.includes(g)?'#7c5cfa':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{tGrades.includes(g)&&<Check size={8} color="#fff"/>}</div>{g}</button>)}</div>
                    <div className="fm-grp"><label className="fm-lbl">Teaching Style</label><select className="fm-sel" value={tStyle} onChange={e=>setTStyle(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 9px center' }}><option value="">Select approach</option>{TUTORING_STYLES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="fm-grp"><label className="fm-lbl">Teaching Mode</label><div className="mode-row">{['Onsite','Online','Both'].map(m=><button key={m} className={`mode-btn${tMode===m?' on':''}`} onClick={()=>setTMode(m)}>{m}</button>)}</div></div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#eae6ff',marginTop:4 }}>Consultation Hours</div>
                    <div className="fm-grp"><label className="fm-lbl">Days</label><div className="day-row">{DAYS.map(d=><button key={d} className={`day-btn${tDays.includes(d)?' on':''}`} onClick={()=>tog(tDays,setTDays,d)}>{d.slice(0,3)}</button>)}</div></div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                      <div className="fm-grp"><label className="fm-lbl">From</label><select className="fm-sel" value={tFrom} onChange={e=>setTFrom(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 8px center' }}>{['06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                      <div className="fm-grp"><label className="fm-lbl">To</label><select className="fm-sel" value={tTo} onChange={e=>setTTo(e.target.value)} style={{ backgroundImage:svgArrow,backgroundRepeat:'no-repeat',backgroundPosition:'right 8px center' }}>{['12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                    </div>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#eae6ff' }}>Review and Submit</div>
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.3)',marginBottom:4 }}>Please review your information before submitting.</div>
                    {[
                      { I:GraduationCap,title:'Academic Information',rows:[tDept||'Not set',tPos||'Not set',`Employee ID: ${tEmpId||'Not set'}`,`Experience: ${tExp||'Not set'}`],goTo:3 },
                      { I:FileText,title:'Verification Documents',rows:['Documents uploaded'],goTo:4 },
                      { I:BookOpen,title:'Teaching Details',rows:[`Subjects: ${tSubs.slice(0,2).join(', ')||'Not set'}`,`Mode: ${tMode||'Not set'}`,`Style: ${tStyle||'Not set'}`],goTo:5 },
                    ].map(({I,title,rows,goTo})=>(
                      <div key={title} className="rv-card">
                        <div className="rv-icon"><I size={14}/></div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}><div className="rv-title">{title}</div><button className="rv-edit" onClick={()=>setStep(goTo)}>Edit</button></div>
                          {rows.map(r=><div key={r} className="rv-row">{r}</div>)}
                        </div>
                      </div>
                    ))}
                    <div className="cfm-row" onClick={()=>setTOk(!tOk)}>
                      <div className={`cfm-box${tOk?' on':''}`}>{tOk&&<Check size={9} color="#fff"/>}</div>
                      <div className="cfm-text">I confirm that all information provided is true and correct.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="rp-footer">
              {step===1&&(<><div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleNext} disabled={loading}>{loading?'Creating...':'Next'}</button></div><div className="rp-link">Already have an account? <NavLink to="/login">Log in</NavLink></div></>)}
              {step===2&&<div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleNext} disabled={loading}>{loading?'Verifying...':'Verify'}</button></div>}
              {role==='student'&&step===3&&<div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleNext}>Next</button></div>}
              {role==='student'&&step===4&&<div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleStudentFinish} disabled={loading}>{loading?'Finishing...':'Create account'}</button></div>}
              {role==='tutor'&&(step===3||step===4)&&<div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleNext}>Next</button></div>}
              {role==='tutor'&&step===5&&<div className="rp-btn-row"><button className="rp-btn-bk" onClick={handleBack}>Back</button><button className="rp-btn" style={{ flex:1 }} onClick={handleTutorSubmit} disabled={!tOk||loading}>{loading?'Submitting...':'Submit Application'}</button></div>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}