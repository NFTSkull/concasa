import { fireEvent, render, screen } from "@testing-library/react";
import LandingPage from "@/components/LandingPage";

describe("LandingPage", () => {
  it("muestra el hero con CTA principal", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { name: /Recupera tu Subcuenta/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Hablar por WhatsApp/i)[0]).toBeInTheDocument();
  });

  it("abre el modal al hacer clic en Revisar si tengo dinero", () => {
    render(<LandingPage />);
    const button = screen.getAllByRole("button", { name: /Revisar si tengo dinero/i })[0];
    fireEvent.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

