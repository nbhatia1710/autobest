import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import VehicleCard from './VehicleCard';
const vehicle = {id:'1', make:'Porsche', model:'911 Carrera', year:2024, category:'Coupe', price:120000, quantity:0};
it('disables purchase when out of stock', () => { render(<VehicleCard vehicle={vehicle} onOpen={()=>{}} onPurchase={()=>{}}/>); expect(screen.getByRole('button',{name:/out of stock/i})).toBeDisabled(); });
it('opens details using a keyboard accessible button', () => { const open = vi.fn(); render(<VehicleCard vehicle={vehicle} onOpen={open} onPurchase={()=>{}}/>); fireEvent.click(screen.getByRole('button', {name:/explore porsche/i})); expect(open).toHaveBeenCalledWith(vehicle); });
it('purchases without opening the detail window', () => { const purchase=vi.fn(), open=vi.fn(); render(<VehicleCard vehicle={{...vehicle,quantity:2}} onOpen={open} onPurchase={purchase}/>); fireEvent.click(screen.getByRole('button',{name:/purchase/i})); expect(purchase).toHaveBeenCalled(); expect(open).not.toHaveBeenCalled(); });
