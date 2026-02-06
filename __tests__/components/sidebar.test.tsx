/// <reference types="@testing-library/jest-dom" />

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { render, screen } from "@testing-library/react";

jest.mock("next/image", () => {
  return function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: any;
  }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    };
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth() {
    return {
      user: {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        name: "Test User",
        roles: ["admin"],
      },
      accessToken: "test-access-token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn(),
    };
  },
}));

describe("AppSidebar", () => {
  it("renders the logo and brand text", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );
    expect(screen.getByText("Decision PRO")).toBeInTheDocument();
    expect(screen.getByText("AIS Platform")).toBeInTheDocument();
  });

  it("renders the Navigation section", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );
    expect(screen.getByText("Navigation")).toBeInTheDocument();
  });
});
