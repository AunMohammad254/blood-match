import { COMPATIBILITY_MAP } from "@/lib/constants";

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  bloodType: string;
  city: string;
  role: "donor" | "recipient";
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockBloodRequest {
  _id: string;
  patientName: string;
  bloodType: string;
  units: number;
  hospital: string;
  city: string;
  urgency: "normal" | "urgent" | "critical";
  contactPhone: string;
  requestedBy: any;
  status: "open" | "fulfilled" | "cancelled";
  createdAt: string;
  updatedAt: string;
  save?: () => Promise<void>;
}

const defaultPasswordHash = "$2a$10$5m2kNRet.9H1bx7XOhKDUe0sJzYQh8s/P/pPNjBXXeVA0nXtlmJKa"; // "secret123"

export const initialUsers: MockUser[] = [
  {
    _id: "usr_donor_1",
    name: "Aun Abbas",
    email: "aun@example.com",
    password: defaultPasswordHash,
    phone: "03001234567",
    bloodType: "B+",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2024-06-01T10:00:00.000Z",
  },
  {
    _id: "usr_recipient_1",
    name: "Dr. Salman",
    email: "recipient@example.com",
    password: defaultPasswordHash,
    phone: "03111112222",
    bloodType: "A+",
    city: "Karachi",
    role: "recipient",
    isAvailable: true,
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2024-06-01T10:00:00.000Z",
  },
  {
    _id: "usr_donor_2",
    name: "Hassan Ali",
    email: "hassan@example.com",
    password: defaultPasswordHash,
    phone: "03001234567",
    bloodType: "O-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-02T10:00:00.000Z",
    updatedAt: "2024-06-02T10:00:00.000Z",
  },
  {
    _id: "usr_donor_3",
    name: "Omar Farooq",
    email: "omar@example.com",
    password: defaultPasswordHash,
    phone: "03001112222",
    bloodType: "O-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-03T10:00:00.000Z",
    updatedAt: "2024-06-03T10:00:00.000Z",
  },
  {
    _id: "usr_donor_4",
    name: "Bilal Ahmed",
    email: "bilal@example.com",
    password: defaultPasswordHash,
    phone: "03211234567",
    bloodType: "B+",
    city: "Lahore",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-04T10:00:00.000Z",
    updatedAt: "2024-06-04T10:00:00.000Z",
  },
  {
    _id: "usr_donor_5",
    name: "Ayesha Malik",
    email: "ayesha@example.com",
    password: defaultPasswordHash,
    phone: "03331234567",
    bloodType: "AB+",
    city: "Islamabad",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-05T10:00:00.000Z",
    updatedAt: "2024-06-05T10:00:00.000Z",
  },
  {
    _id: "usr_donor_6",
    name: "Fahad Mustafa",
    email: "fahad@example.com",
    password: defaultPasswordHash,
    phone: "03009998888",
    bloodType: "A-",
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-06T10:00:00.000Z",
    updatedAt: "2024-06-06T10:00:00.000Z",
  },
  {
    _id: "usr_donor_7",
    name: "Sara Khan",
    email: "sara@example.com",
    password: defaultPasswordHash,
    phone: "03007776666",
    bloodType: "O+",
    city: "Lahore",
    role: "donor",
    isAvailable: true,
    createdAt: "2024-06-07T10:00:00.000Z",
    updatedAt: "2024-06-07T10:00:00.000Z",
  },
];

export const initialRequests: MockBloodRequest[] = [
  {
    _id: "req_1",
    patientName: "Zara Khan",
    bloodType: "AB-",
    units: 2,
    hospital: "Aga Khan Hospital",
    city: "Karachi",
    urgency: "critical",
    contactPhone: "03111234567",
    requestedBy: "usr_recipient_1",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "req_2",
    patientName: "Ahmed Raza",
    bloodType: "B+",
    units: 3,
    hospital: "Shaukat Khanum Hospital",
    city: "Lahore",
    urgency: "urgent",
    contactPhone: "03221234567",
    requestedBy: "usr_recipient_1",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "req_3",
    patientName: "Tariq Jamil",
    bloodType: "O-",
    units: 1,
    hospital: "PIMS Hospital",
    city: "Islamabad",
    urgency: "normal",
    contactPhone: "03331234567",
    requestedBy: "usr_recipient_1",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "req_4",
    patientName: "Fatima Bhutto",
    bloodType: "A+",
    units: 2,
    hospital: "South City Hospital",
    city: "Karachi",
    urgency: "urgent",
    contactPhone: "03005554444",
    requestedBy: "usr_donor_1",
    status: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString(),
  },
];

// Global mutable instances
export const memoryDatabase = {
  users: [...initialUsers],
  bloodRequests: [...initialRequests],
};

// Helper for MockQuery
class MockQuery<T> {
  constructor(private data: T | null, private isArray: boolean = false) {}
  select() {
    return this;
  }
  sort(criteria: any) {
    if (this.isArray && Array.isArray(this.data)) {
      if (criteria && criteria.createdAt === -1) {
        this.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (criteria && criteria.createdAt === 1) {
        this.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }
    return this;
  }
  lean() {
    return this.data;
  }
  populate(field: string, selectProps?: string) {
    if (this.isArray && Array.isArray(this.data) && field === "requestedBy") {
      this.data = this.data.map((item: any) => {
        const u = memoryDatabase.users.find((user) => user._id === item.requestedBy);
        return {
          ...item,
          requestedBy: u ? { _id: u._id, name: u.name, city: u.city } : item.requestedBy,
        };
      }) as any;
    }
    return this;
  }
  then(onfulfilled?: ((value: T | null) => any) | null, onrejected?: ((reason: any) => any) | null): Promise<any> {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

// User Memory Operations
export const UserMemoryModel = {
  findOne: (query: any) => {
    let matches = memoryDatabase.users;
    if (query.email) {
      matches = matches.filter((u) => u.email.toLowerCase() === query.email.toLowerCase());
    }
    return new MockQuery(matches[0] || null, false);
  },
  find: (query: any) => {
    let matches = memoryDatabase.users;
    if (query.role) {
      matches = matches.filter((u) => u.role === query.role);
    }
    if (query.isAvailable !== undefined) {
      matches = matches.filter((u) => u.isAvailable === query.isAvailable);
    }
    if (query.bloodType) {
      if (query.bloodType.$in) {
        matches = matches.filter((u) => query.bloodType.$in.includes(u.bloodType));
      } else {
        matches = matches.filter((u) => u.bloodType === query.bloodType);
      }
    }
    if (query.city) {
      if (query.city.$regex) {
        const reg = new RegExp(query.city.$regex, query.city.$options || "i");
        matches = matches.filter((u) => reg.test(u.city));
      } else {
        matches = matches.filter((u) => u.city.toLowerCase() === query.city.toLowerCase());
      }
    }
    return new MockQuery([...matches], true);
  },
  create: async (data: any) => {
    const newUser: MockUser = {
      ...data,
      _id: "usr_" + Date.now(),
      isAvailable: data.isAvailable ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDatabase.users.push(newUser);
    return newUser;
  },
  findById: (id: string) => {
    const user = memoryDatabase.users.find((u) => u._id === id || u._id.toString() === id);
    return new MockQuery(user || null, false);
  },
  findByIdAndUpdate: (id: string, update: any, options?: any) => {
    const idx = memoryDatabase.users.findIndex((u) => u._id === id || u._id.toString() === id);
    if (idx === -1) return new MockQuery(null, false);

    const current = memoryDatabase.users[idx];
    const updated = { ...current, ...update, updatedAt: new Date().toISOString() };
    memoryDatabase.users[idx] = updated;

    return new MockQuery(options?.new ? updated : current, false);
  },
  countDocuments: async () => memoryDatabase.users.length,
};

// BloodRequest Memory Operations
export const BloodRequestMemoryModel = {
  find: (query: any) => {
    let matches = memoryDatabase.bloodRequests;
    if (query.status) {
      matches = matches.filter((r) => r.status === query.status);
    }
    if (query.requestedBy) {
      matches = matches.filter((r) => r.requestedBy === query.requestedBy);
    }
    if (query.city) {
      if (query.city.$regex) {
        const reg = new RegExp(query.city.$regex, query.city.$options || "i");
        matches = matches.filter((r) => reg.test(r.city));
      } else {
        matches = matches.filter((r) => r.city.toLowerCase() === query.city.toLowerCase());
      }
    }
    if (query.bloodType) {
      matches = matches.filter((r) => r.bloodType === query.bloodType);
    }
    return new MockQuery([...matches], true);
  },
  create: async (data: any) => {
    const newReq: MockBloodRequest = {
      ...data,
      _id: "req_" + Date.now(),
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDatabase.bloodRequests.push(newReq);
    return newReq;
  },
  findById: async (id: string) => {
    const item = memoryDatabase.bloodRequests.find((r) => r._id === id);
    if (!item) return null;

    // Return a mutable copy with a save method
    const mutableItem = {
      ...item,
      requestedBy: { toString: () => item.requestedBy },
      save: async () => {
        const idx = memoryDatabase.bloodRequests.findIndex((r) => r._id === id);
        if (idx !== -1) {
          memoryDatabase.bloodRequests[idx] = {
            ...memoryDatabase.bloodRequests[idx],
            status: mutableItem.status,
            updatedAt: new Date().toISOString(),
          };
        }
      },
    };
    return mutableItem;
  },
  countDocuments: async () => memoryDatabase.bloodRequests.length,
};
