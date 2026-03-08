import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateProfile } from "@/types";
import { User, Briefcase, GraduationCap, Award, MapPin, DollarSign, Plus, X, Edit3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";

const Profile: React.FC = () => {
  const { profile, setProfile, userId } = useProfile();
  const [newSkill, setNewSkill] = useState("");

  // Single atomic handler — avoids the race condition where two separate callbacks
  // would each capture a stale `profile` snapshot and the second save would overwrite the first.
  const handleResumeComplete = (fileName: string, parsed?: Partial<CandidateProfile>) => {
    setProfile({ ...profile, ...(parsed ?? {}), resumeUploaded: true, resumeFileName: fileName });
  };

  const update = (partial: Partial<CandidateProfile>) => setProfile({ ...profile, ...partial });

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      update({ skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => update({ skills: profile.skills.filter((sk) => sk !== s) });

  const remoteOptions: { value: CandidateProfile["remotePreference"]; label: string }[] = [
    { value: "remote", label: "Remote Only" },
    { value: "hybrid", label: "Hybrid" },
    { value: "onsite", label: "Onsite" },
    { value: "flexible", label: "Flexible" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="My Profile" subtitle="Manage your candidate profile and preferences" />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2"><User className="w-3.5 h-3.5" />Profile</TabsTrigger>
            <TabsTrigger value="experience" className="gap-2"><Briefcase className="w-3.5 h-3.5" />Experience</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2"><MapPin className="w-3.5 h-3.5" />Preferences</TabsTrigger>
            <TabsTrigger value="resume" className="gap-2"><Award className="w-3.5 h-3.5" />Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-4"><CardTitle className="text-sm font-bold">Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Full Name</Label><Input value={profile.name} onChange={(e) => update({ name: e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Current Job Title</Label><Input value={profile.currentTitle} onChange={(e) => update({ currentTitle: e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={profile.email} onChange={(e) => update({ email: e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Phone</Label><Input value={profile.phone} onChange={(e) => update({ phone: e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Location</Label><Input value={profile.location} onChange={(e) => update({ location: e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Years of Experience</Label><Input type="number" value={profile.yearsOfExperience} onChange={(e) => update({ yearsOfExperience: +e.target.value })} className="mt-1 h-9 text-sm" /></div>
                  </div>
                  <div><Label className="text-xs">Professional Summary</Label><Textarea value={profile.summary} onChange={(e) => update({ summary: e.target.value })} className="mt-1 text-sm min-h-[80px]" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-sm font-bold">Industries</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.industries.map((ind) => (
                      <Badge key={ind} variant="secondary" className="gap-1.5 pr-1">{ind}
                        <button onClick={() => update({ industries: profile.industries.filter((i) => i !== ind) })}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Add industry..." className="h-8 text-xs" id="ind-input" />
                    <Button size="sm" className="h-8 px-2" onClick={() => {
                      const el = document.getElementById("ind-input") as HTMLInputElement;
                      if (el.value) { update({ industries: [...profile.industries, el.value] }); el.value = ""; }
                    }}><Plus className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-4"><CardTitle className="text-sm font-bold">Skills & Technologies ({profile.skills.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1.5 pr-1">{s}
                      <button onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <Input placeholder="Add skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} className="h-8 text-xs" />
                  <Button size="sm" className="h-8 px-2" onClick={addSkill}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-4 animate-fade-in">
            {profile.experience.map((exp, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{exp.startDate} – {exp.endDate}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Edit3 className="w-3.5 h-3.5" /></Button>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {exp.description.map((d, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex gap-2"><span className="text-primary mt-0.5">•</span>{d}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {exp.skills.map((s) => (<span key={s} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">{s}</span>))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><GraduationCap className="w-4 h-4" />Education</CardTitle></CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {profile.education.map((ed, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{ed.degree} in {ed.field}</p>
                      <p className="text-xs text-muted-foreground">{ed.school} · {ed.year}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Award className="w-4 h-4" />Certifications</CardTitle></CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.year}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><Briefcase className="w-4 h-4" />Job Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Desired Job Titles</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.desiredTitles.map((t) => (
                        <Badge key={t} variant="secondary" className="gap-1.5 pr-1">{t}
                          <button onClick={() => update({ desiredTitles: profile.desiredTitles.filter((dt) => dt !== t) })}><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">Remote Preference</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {remoteOptions.map(({ value, label }) => (
                        <button key={value} onClick={() => update({ remotePreference: value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${profile.remotePreference === value ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">Preferred Locations</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferredLocations.map((loc) => (
                        <Badge key={loc} variant="secondary" className="gap-1.5 pr-1"><MapPin className="w-3 h-3" />{loc}
                          <button onClick={() => update({ preferredLocations: profile.preferredLocations.filter((l) => l !== loc) })}><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4" />Compensation & Visa</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Min Salary ($)</Label><Input type="number" value={profile.salaryMin} onChange={(e) => update({ salaryMin: +e.target.value })} className="mt-1 h-9 text-sm" /></div>
                    <div><Label className="text-xs">Max Salary ($)</Label><Input type="number" value={profile.salaryMax} onChange={(e) => update({ salaryMax: +e.target.value })} className="mt-1 h-9 text-sm" /></div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={profile.requiresVisaSponsorship} onChange={(e) => update({ requiresVisaSponsorship: e.target.checked })} className="w-4 h-4 accent-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">I require visa sponsorship</p>
                        <p className="text-xs text-muted-foreground">Filter for H-1B friendly companies</p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resume" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader className="pb-4"><CardTitle className="text-sm font-bold">Resume Upload</CardTitle></CardHeader>
              <CardContent>
                <ResumeUpload
                  onUpload={handleUpload}
                  onProfileParsed={handleProfileParsed}
                  uploaded={profile.resumeUploaded}
                  fileName={profile.resumeFileName}
                  userId={userId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
