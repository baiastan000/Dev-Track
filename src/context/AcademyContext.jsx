import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { courses as learningCourses } from "../data/courses.js";

const STORAGE_KEY = "devtrack.academy.v1";
const AcademyContext = createContext(null);

const initialCatalog = learningCourses.map((course, index) => ({
  id: course.id,
  linkedCourseId: course.id,
  title: course.title,
  subtitle: course.subtitle,
  description: course.description,
  category: course.id === "react" ? "React" : course.id === "javascript" ? "JavaScript" : "HTML / CSS",
  level: index > 1 ? "intermediate" : "beginner",
  duration: course.topics.length,
  price: [2500, 3000, 4500, 5500][index],
}));

function createId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readAcademyState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        data: { catalog: initialCatalog, cart: {}, bookings: [], orders: [], attendance: [] },
        error: "",
      };
    }

    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      !Array.isArray(parsed.catalog) ||
      !parsed.cart ||
      typeof parsed.cart !== "object" ||
      Array.isArray(parsed.cart) ||
      !Array.isArray(parsed.bookings) ||
      !Array.isArray(parsed.orders)
    ) {
      throw new Error("Saved course catalog data has an unexpected format.");
    }

    const attendance = Array.isArray(parsed.attendance)
      ? parsed.attendance.filter((record) =>
          record &&
          typeof record.id === "string" &&
          typeof record.studentName === "string" &&
          typeof record.courseId === "string" &&
          typeof record.courseTitle === "string" &&
          typeof record.lessonTitle === "string" &&
          typeof record.attendedAt === "string" &&
          !Number.isNaN(Date.parse(record.attendedAt)) &&
          ["attended", "missed"].includes(record.status),
        )
      : [];

    const byId = new Map(parsed.catalog
      .filter((course) =>
        course &&
        typeof course.id === "string" &&
        typeof course.title === "string" &&
        typeof course.description === "string" &&
        typeof course.category === "string" &&
        Number.isFinite(course.price) &&
        course.price >= 0,
      )
      .map((course) => [course.id, course]));
    const catalog = [
      ...initialCatalog.filter((course) => byId.has(course.id))
        .map((course) => ({ ...course, ...byId.get(course.id) })),
      ...[...byId.values()].filter((course) =>
        !initialCatalog.some((initialCourse) => initialCourse.id === course.id),
      ),
    ];
    const validCourseIds = new Set(catalog.map((course) => course.id));

    return {
      data: {
        catalog,
        cart: Object.fromEntries(
          Object.entries(parsed.cart).filter(([courseId, quantity]) =>
            validCourseIds.has(courseId) &&
            Number.isInteger(quantity) && quantity > 0 && quantity <= 10,
          ),
        ),
        bookings: parsed.bookings.filter((booking) => booking && typeof booking.id === "string"),
        orders: parsed.orders.filter((order) => order && typeof order.id === "string"),
        attendance,
      },
      error: "",
    };
  } catch (error) {
    console.error("Could not load academy demo data from localStorage.", error);
    return {
      data: { catalog: initialCatalog, cart: {}, bookings: [], orders: [], attendance: [] },
      error: "Could not read saved course data. The demo catalog has been restored.",
    };
  }
}

export function AcademyProvider({ children }) {
  const [initialState] = useState(readAcademyState);
  const [data, setData] = useState(initialState.data);
  const [storageError, setStorageError] = useState(initialState.error);
  const skipInitialSave = useRef(Boolean(initialState.error));

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError("");
    } catch (error) {
      console.error("Could not save academy demo data to localStorage.", error);
      setStorageError("Could not save course changes. Check browser localStorage availability.");
    }
  }, [data, initialState.error]);

  const value = useMemo(
    () => ({
      ...data,
      storageError,
      addCourse(course) {
        setData((current) => ({
          ...current,
          catalog: [{ ...course, id: createId("course") }, ...current.catalog],
        }));
      },
      updateCourse(courseId, updates) {
        setData((current) => ({
          ...current,
          catalog: current.catalog.map((course) =>
            course.id === courseId
              ? { ...course, ...updates, titleOverride: updates.title }
              : course,
          ),
        }));
      },
      deleteCourse(courseId) {
        setData((current) => {
          const cart = { ...current.cart };
          delete cart[courseId];
          return {
            ...current,
            catalog: current.catalog.filter((course) => course.id !== courseId),
            cart,
          };
        });
      },
      addToCart(courseId) {
        setData((current) => {
          const course = current.catalog.find((item) => item.id === courseId);
          if (!course) return current;
          const quantity = current.cart[courseId] ?? 0;
          if (quantity >= 10) return current;
          return { ...current, cart: { ...current.cart, [courseId]: quantity + 1 } };
        });
      },
      setCartQuantity(courseId, quantity) {
        setData((current) => {
          if (!current.catalog.some((course) => course.id === courseId)) return current;
          const cart = { ...current.cart };
          if (!Number.isInteger(quantity) || quantity <= 0) {
            delete cart[courseId];
          } else {
            cart[courseId] = Math.min(quantity, 10);
          }
          return { ...current, cart };
        });
      },
      addBooking(booking) {
        const savedBooking = { ...booking, id: createId("trial"), createdAt: Date.now() };
        setData((current) => ({ ...current, bookings: [savedBooking, ...current.bookings] }));
        return savedBooking;
      },
      addAttendance(record) {
        const savedRecord = {
          ...record,
          id: createId("attendance"),
          createdAt: Date.now(),
        };
        setData((current) => ({
          ...current,
          attendance: [savedRecord, ...current.attendance],
        }));
        return savedRecord;
      },
      addOrder(order) {
        const savedOrder = { ...order, id: createId("enrollment"), createdAt: Date.now() };
        setData((current) => ({ ...current, orders: [savedOrder, ...current.orders], cart: {} }));
        return savedOrder;
      },
    }),
    [data, storageError],
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error("useAcademy must be used inside AcademyProvider.");
  }
  return context;
}
