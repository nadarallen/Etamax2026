'use client';

import { X, Mail, MapPin, Globe, Instagram } from 'lucide-react';

export default function AboutUsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const councilEmails = [
        { role: 'General Secretary', email: 'gs.etamax@fcrit.ac.in', name: 'Student Council' },
        { role: 'Cultural Secretary', email: 'cultural.etamax@fcrit.ac.in', name: 'Cultural Team' },
        { role: 'Technical Secretary', email: 'technical.etamax@fcrit.ac.in', name: 'Technical Team' },
        { role: 'Sports Secretary', email: 'sports.etamax@fcrit.ac.in', name: 'Sports Team' },
        { role: 'Documentation Head', email: 'doc.etamax@fcrit.ac.in', name: 'Documentation Team' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-2xl p-0 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide flex flex-col md:flex-row overflow-hidden">

                {/* Left Side - Image/Visual */}
                <div className="w-full md:w-1/3 bg-galaxy-purple/10 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-galaxy-purple/30 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
                            <img src="/planets/logo.jpeg" alt="Council Logo" className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tighter">ETAMAX <span className="text-galaxy-purple">2026</span></h3>
                        <p className="text-gray-400 text-xs mt-2 font-medium tracking-wider uppercase">FCRIT Vashi</p>
                    </div>
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        About Us
                    </h2>

                    <div className="space-y-6">
                        {/* College Info */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                            <h4 className="text-sm font-bold text-galaxy-accent uppercase tracking-wider mb-3">Institution</h4>
                            <p className="text-gray-300 font-medium leading-relaxed">
                                Fr. C. Rodrigues Institute of Technology
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                                <MapPin size={14} className="text-galaxy-purple" />
                                <span>Agnel Charities, F.C.R.I.T, Vashi, Navi Mumbai - 400703</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <Globe size={14} className="text-galaxy-purple" />
                                <a href="https://fcrit.ac.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">www.fcrit.ac.in</a>
                            </div>
                        </div>

                        {/* Contact Emails */}
                        <div>
                            <h4 className="text-sm font-bold text-galaxy-accent uppercase tracking-wider mb-3 px-1">Contact Council</h4>
                            <div className="grid gap-2">
                                {councilEmails.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-galaxy-purple/20 flex items-center justify-center text-galaxy-purple group-hover:scale-110 transition-transform">
                                                <Mail size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.role}</p>
                                                {/* <p className="text-[10px] text-gray-500">{item.name}</p> */}
                                            </div>
                                        </div>
                                        <a href={`mailto:${item.email}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                                            {item.email}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    <div>
                        <h4 className="text-sm font-bold text-galaxy-accent uppercase tracking-wider mb-3 px-1 mt-6">Meet the Team</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { name: "Allen Salmo", link: "https://www.instagram.com/allensalmo?igsh=emkydWFiemVxbG55", highlight: true },
                                { name: "Akshat Sawant", link: "https://www.instagram.com/curlyoffroader?igsh=cTllazRnYXVid3o0" },
                                { name: "Ronit Sinkar", link: "https://www.instagram.com/ronitsinkar._?igsh=d2xlanNxamN0ODh3" },
                                { name: "Vishal Gangaji", link: "https://www.instagram.com/vishal_gangaji?igsh=NHd5bm1weTlkdHpr" },
                                { name: "Shloka Karbhajan", link: "https://www.instagram.com/shloka_karbhajan?igsh=MTE2YnJ1aGo2N252dw==" },
                                { name: "Ivan Thomas", link: "https://www.instagram.com/__.ivann45.__?igsh=MWdubWM0dmtnaG03NA==" },
                                { name: "Prachi Pawar", link: "https://www.instagram.com/_.prachi._.11._?igsh=MWtyN3JjeWV0NW95NA==" },
                                { name: "Arya Nikam", link: "https://www.instagram.com/arya_2317?igsh=MmRoOXlyMW1pZWVo" },
                                { name: "Aakash Bhoyar", link: "https://www.instagram.com/aakashh.ig?igsh=MWdsZWw5Z2s2a3Zobg==" },
                                { name: "Mrunmayee Tamse", link: "https://www.instagram.com/mrunmayee_072?igsh=MTFyOHBmdGQ3NzA4aA==" },
                                { name: "Aman Chauhan", link: "https://www.instagram.com/thakuraman0003?igsh=cjg2OHpxZmd6ZWF1" },
                                { name: "Sejal Pawar", link: "https://www.instagram.com/sej_1005?igsh=eWE1Y2V6bzJhbHYz" },
                                { name: "Arpita Pawar", link: "https://www.instagram.com/arpitawhatever?igsh=MXRyd29oMm53cm1scw==" },
                                { name: "Shreenidha Panagaden", link: "https://www.instagram.com/shreenidha_05?igsh=MTV5eWttejQ5eTYwaQ==" },
                                { name: "Joel Joseph", link: "https://www.instagram.com/iamcherian14?igsh=MTZ5NjZ1Ym9vZ3Bydw==" }
                            ].map((member, idx) => (
                                <a
                                    key={idx}
                                    href={member.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all group ${member.highlight ? 'bg-galaxy-purple/20 border-galaxy-purple/50 shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-galaxy-purple/30'}`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                                        <Instagram size={12} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-medium text-gray-300 group-hover:text-white truncate">
                                            {member.name}
                                        </span>
                                        {member.highlight && (
                                            <span className="text-[10px] text-green-400 font-bold animate-pulse leading-none mt-0.5">
                                                Please Follow!
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-600">
                            © 2026 Etamax • Built with stardust by the Tech Team
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
