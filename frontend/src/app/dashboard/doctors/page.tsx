"use client";

import { useEffect, useState } from "react";
import API from "../../../lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, User, Stethoscope, Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type DoctorForm = {
  name: string;
  specialization: string;
  gender: string;
  location: string;
  availability: string[];
  workingHours: Record<string, { start: string; end: string }>;
};

export default function DoctorsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doctors, setDoctors] = useState<any[]>([]);
  const router = useRouter();
  const [upcomingMap, setUpcomingMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scheduleData, setScheduleData] = useState<any>(null);

  const [form, setForm] = useState<DoctorForm>({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availability: [],
    workingHours: {},
  });

  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DoctorForm>({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availability: [],
    workingHours: {},
  });

  const parseWorkingHours = (
    wh: Record<string, string>
  ): Record<string, { start: string; end: string }> => {
    const parsed: Record<string, { start: string; end: string }> = {};
    for (const day in wh) {
      const parts = wh[day].split("-");
      parsed[day] = {
        start: parts[0] || "",
        end: parts[1] || "",
      };
    }
    return parsed;
  };

  const serializeWorkingHours = (
    wh: Record<string, { start: string; end: string }>
  ): Record<string, string> => {
    const serialized: Record<string, string> = {};
    for (const day in wh) {
      if (wh[day].start && wh[day].end) {
        serialized[day] = `${wh[day].start}-${wh[day].end}`;
      }
    }
    return serialized;
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctors");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = res.data.map((doc: any) => ({
        ...doc,
        workingHours: parseWorkingHours(doc.workingHours || {}),
      }));
      setDoctors(docs);

      const map: Record<string, boolean> = {};
      await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        docs.map(async (doc: any) => {
          try {
            const schedule = await API.get(`/doctors/${doc.id}/schedule`);
            map[doc.id] = schedule.data.upcoming?.length > 0;
          } catch {
            map[doc.id] = false;
          }
        })
      );
      setUpcomingMap(map);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
      toast.error("Failed to fetch doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const toggleDay = (
    day: string,
    currentAvailability: string[],
    currentWorkingHours: Record<string, { start: string; end: string }>,
    setAvailability: (arr: string[]) => void,
    setWorkingHours: (wh: Record<string, { start: string; end: string }>) => void
  ) => {
    if (currentAvailability.includes(day)) {
      setAvailability(currentAvailability.filter((d) => d !== day));
      const newWH = { ...currentWorkingHours };
      delete newWH[day];
      setWorkingHours(newWH);
    } else {
      setAvailability([...currentAvailability, day]);
    }
  };

  const validateForm = (data: DoctorForm) => {
    if (!data.name.trim()) {
      toast.error("Please enter doctor's name");
      return false;
    }
    for (const day of data.availability) {
      const wh = data.workingHours[day];
      if (!wh || !wh.start || !wh.end || wh.start >= wh.end) {
        toast.error(`Please enter valid start and end times for ${day} (start must be before end)`);
        return false;
      }
    }
    return true;
  };

  const addDoctor = async () => {
    if (!validateForm(form)) return;
    try {
      await API.post("/doctors", {
        ...form,
        workingHours: serializeWorkingHours(form.workingHours),
      });
      setForm({
        name: "",
        specialization: "",
        gender: "",
        location: "",
        availability: [],
        workingHours: {},
      });
      setIsAddDialogOpen(false);
      fetchDoctors();
      toast.success("Doctor added successfully");
    } catch (error) {
      toast.error("Failed to add doctor");
      console.error(error);
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      await API.delete(`/doctors/${id}`);
      fetchDoctors();
      toast.success("Doctor deleted successfully");
    } catch (error) {
      toast.error("Failed to delete doctor");
      console.error(error);
    }
  };

  const viewSchedule = async (id: string) => {
    try {
      const res = await API.get(`/doctors/${id}/schedule`);
      const data = res.data;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setScheduleData(data);
      setIsScheduleDialogOpen(true);
    } catch {
      toast.error("Failed to fetch schedule");
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEdit = (doc: any) => {
    setEditingDoctorId(doc.id);
    setEditForm({
      name: doc.name,
      specialization: doc.specialization,
      gender: doc.gender,
      location: doc.location,
      availability: doc.availability || [],
      workingHours: doc.workingHours || {},
    });
    setIsEditDialogOpen(true);
  };

  const saveDoctor = async () => {
    if (!editingDoctorId) return;
    if (!validateForm(editForm)) return;
    try {
      await API.put(`/doctors/${editingDoctorId}`, {
        ...editForm,
        workingHours: serializeWorkingHours(editForm.workingHours),
      });
      setEditingDoctorId(null);
      setIsEditDialogOpen(false);
      fetchDoctors();
      toast.success("Doctor updated successfully");
    } catch (error) {
      toast.error("Failed to update doctor");
      console.error(error);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const term = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.specialization.toLowerCase().includes(term) ||
      doc.location.toLowerCase().includes(term)
    );
  });

  const AvailabilityHoursInput = ({
    availability,
    workingHours,
    setAvailability,
    setWorkingHours,
  }: {
    availability: string[];
    workingHours: Record<string, { start: string; end: string }>;
    setAvailability: (arr: string[]) => void;
    setWorkingHours: (wh: Record<string, { start: string; end: string }>) => void;
  }) => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Available Days</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={availability.includes(day)}
                  onCheckedChange={() =>
                    toggleDay(day, availability, workingHours, setAvailability, setWorkingHours)
                  }
                />
                <Label htmlFor={day} className="text-sm font-normal cursor-pointer">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {availability.length > 0 && (
          <div>
            <Label className="text-base font-medium mb-3 block">Working Hours</Label>
            <div className="space-y-3">
              {availability.map((day) => (
                <div key={day} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Label className="w-20 text-sm font-medium">{day}</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      className="flex-1"
                      value={workingHours[day]?.start || ""}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day]: {
                            start: e.target.value,
                            end: workingHours[day]?.end || "",
                          },
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      className="flex-1"
                      value={workingHours[day]?.end || ""}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          [day]: {
                            start: workingHours[day]?.start || "",
                            end: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>;
      case "Busy":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Busy</Badge>;
      default:
        return <Badge variant="destructive" className="bg-red-400">Unavailable</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors Management</h1>
          <p className="text-muted-foreground">Manage doctor profiles and schedules</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-black text-white">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Add New Doctor
              </DialogTitle>
              <DialogDescription>
                Enter the doctor information and availability schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Dr. Anitha"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="Cardiology"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    placeholder="Male/Female"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Bengaluru"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
              </div>

              <AvailabilityHoursInput
                availability={form.availability}
                workingHours={form.workingHours}
                setAvailability={(arr) => setForm((prev) => ({ ...prev, availability: arr }))}
                setWorkingHours={(wh) => setForm((prev) => ({ ...prev, workingHours: wh }))}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addDoctor} className="bg-black text-white">Add Doctor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search doctors by name, specialization, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Doctors Table */}
      <Card className="border-none shadow-none ">
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
          <CardDescription>
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="bg-white rounded-2xl border border-black overflow-hidden text-base ">
            <TableHeader className="bg-[#f8f8f8]">
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No doctors found. Add a new doctor to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.gender}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(doc.status)}
                        {doc.nextAvailable && (
                          <p className="text-xs text-muted-foreground">{doc.nextAvailable}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.specialization}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1 max-w-xs">
                        {doc.availability?.slice(0, 2).map((day: string) => (
                          <div key={day} className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {day}: {doc.workingHours?.[day] 
                                ? `${doc.workingHours[day].start} - ${doc.workingHours[day].end}`
                                : "N/A"}
                            </span>
                          </div>
                        ))}
                        {doc.availability?.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{doc.availability.length - 2} more</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSchedule(doc.id)}
                          className="h-8 w-28 bg-black text-white p-0"
                        >
                          Schedule
                          <Eye className="h-4 w-4"/>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog >
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this doctor? This action cannot be undone and will also delete all future appointments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDoctor(doc.id)}
                                className="bg-red-600 cursor-pointer text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Doctor
            </DialogTitle>
            <DialogDescription>
              Update the doctor information and availability schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={editForm.specialization}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, specialization: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Input
                  id="edit-gender"
                  value={editForm.gender}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <AvailabilityHoursInput
              availability={editForm.availability}
              workingHours={editForm.workingHours}
              setAvailability={(arr) => setEditForm((prev) => ({ ...prev, availability: arr }))}
              setWorkingHours={(wh) => setEditForm((prev) => ({ ...prev, workingHours: wh }))}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveDoctor} className="bg-black text-white">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Doctor Schedule
            </DialogTitle>
            <DialogDescription>
              Current schedule and upcoming appointments
            </DialogDescription>
          </DialogHeader>
          {scheduleData && (
            <div className="space-y-6 py-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{scheduleData.doctor?.name}</CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant={scheduleData.isFreeNow ? "default" : "secondary"} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${scheduleData.isFreeNow ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      {scheduleData.isFreeNow ? "Available Now" : `Busy for ${scheduleData.timeUntilFreeMinutes} minutes`}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduleData.upcoming && scheduleData.upcoming.length > 0 ? (
                    <div className="space-y-3 max-h-[170px] overflow-y-scroll">
                        {/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                      {scheduleData.upcoming.map((appointment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{appointment.patientName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(appointment.timeSlot).toLocaleDateString()}</span>
                                <Clock className="h-4 w-4" />
                                <span>{new Date(appointment.timeSlot).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}