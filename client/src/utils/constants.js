import {
  max,
  min,
  email,
  invalid,
  maxLength,
  minLength,
  required,
} from "./form-message-builders";

export const PAGE_SIZE = 10;

export const QUERY_KEYS = {
  USERS: "users",
  ORDERS: "orders",
  ORDER: "order",
  PRODUCTS: "products",
  PRODUCT: "product",
  INVENTORY_ITEMS: "inventoryItems",
  PRODUCT_REVIEWS: "productReviews",
};

export const REGEX_PATTERNS = {
  VIETNAMESE_PHONE_NUMBER: /^((09|03|07|08|05)+([0-9]{8}))$/,
  VIETNAMESE_NAME: /^[a-zA-ZÀ-ỹ\s]{1,50}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const FORM_RULES = {
  REQUIRED: (field) => {
    return { required: required`${field}` };
  },
  EMAIL: {
    required: required`email`,
    pattern: {
      value: REGEX_PATTERNS.EMAIL,
      message: email``,
    },
  },
  FULL_NAME: {
    required: required`tên`,
    minLength: {
      value: 3,
      message: minLength`tên ${3}`,
    },
    pattern: {
      value: REGEX_PATTERNS.VIETNAMESE_NAME,
      message: invalid`tên`,
    },
  },
  PHONE: {
    pattern: {
      value: REGEX_PATTERNS.VIETNAMESE_PHONE_NUMBER,
      message: invalid`số điện thoại`,
    },
    maxLength: {
      value: 10,
      message: maxLength`số điện thoại ${10}`,
    },
  },
  PASSWORD: {
    required: required`mật khẩu`,
    min: {
      value: 6,
      message: minLength`mật khẩu ${6}`,
    },
  },
  PRODUCT_NAME: {
    required: required`Tên sản phẩm`,
    pattern: {
      value: REGEX_PATTERNS.VIETNAMESE_NAME,
      message: invalid`Tên sản phẩm`,
    },
    minLength: {
      value: 3,
      message: minLength`Tên sản phẩm ${3}`,
    },
    maxLength: {
      value: 50,
      message: maxLength`Tên sản phẩm ${50}`,
    },
  },
  PRICE: {
    required: required`Giá`,
    min: {
      value: 1000,
      message: min`Giá ${1000}`,
    },
    max: {
      value: 100000000,
      message: max`Giá ${100000000}`,
    },
  },
  DESCRIPTION: {
    minLength: {
      value: 10,
      message: minLength`Mô tả ${10}`,
    },
    maxLength: {
      value: 256,
      message: maxLength`Mô tả ${256}`,
    },
  },
};

export const USER_ROLES = ["admin", "customer", "staff", "cashier"];

export const BACKEND_URL = "http://localhost:6969/api/v1";
export const IMAGE_URL = "http://localhost:6969";

export const PRODUCT_CATEGORIES = ["food", "beverage", "other"];
