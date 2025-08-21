import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyFilters } from '../CompanyFilters';

describe('CompanyFilters', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    selectedIndustry: 'all',
    onIndustryChange: vi.fn(),
    selectedLocation: 'all',
    onLocationChange: vi.fn(),
    industries: ['Tecnología', 'Salud', 'Finanzas', 'Educación'],
    locations: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<CompanyFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar empresas por nombre o descripción...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Buscar empresas');
  });

  it('renders filter toggle button', () => {
    render(<CompanyFilters {...mockProps} />);
    
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    expect(filterButton).toBeInTheDocument();
    expect(filterButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles filters panel when filter button is clicked', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    
    await user.click(filterButton);
    expect(filterButton).toHaveAttribute('aria-expanded', 'true');
    
    // Should show industry and location filters
    expect(screen.getByLabelText(/sector/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ubicación/i)).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar empresas por nombre o descripción...');
    await user.type(searchInput, 'test company');
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test company');
  });

  it('renders industry options correctly', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const industrySelect = screen.getByLabelText(/sector/i);
    expect(industrySelect).toBeInTheDocument();
    
    // Check options
    expect(screen.getByText('Todos los sectores')).toBeInTheDocument();
    mockProps.industries.forEach(industry => {
      expect(screen.getByText(industry)).toBeInTheDocument();
    });
  });

  it('renders location options correctly', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const locationSelect = screen.getByLabelText(/ubicación/i);
    expect(locationSelect).toBeInTheDocument();
    
    // Check options
    expect(screen.getByText('Todas las ubicaciones')).toBeInTheDocument();
    mockProps.locations.forEach(location => {
      expect(screen.getByText(location)).toBeInTheDocument();
    });
  });

  it('calls onIndustryChange when industry is selected', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const industrySelect = screen.getByLabelText(/sector/i);
    await user.selectOptions(industrySelect, 'Tecnología');
    
    expect(mockProps.onIndustryChange).toHaveBeenCalledWith('Tecnología');
  });

  it('calls onLocationChange when location is selected', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const locationSelect = screen.getByLabelText(/ubicación/i);
    await user.selectOptions(locationSelect, 'Madrid');
    
    expect(mockProps.onLocationChange).toHaveBeenCalledWith('Madrid');
  });

  it('shows active filter indicator when filters are applied', () => {
    const propsWithFilters = {
      ...mockProps,
      searchTerm: 'test',
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithFilters} />);
    
    // Should show indicator dot
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    const indicator = filterButton.querySelector('.bg-sky-500');
    expect(indicator).toBeInTheDocument();
    
    // Should show clear filters button
    expect(screen.getByText('Limpiar Filtros')).toBeInTheDocument();
  });

  it('displays active filters as tags', () => {
    const propsWithFilters = {
      ...mockProps,
      searchTerm: 'test company',
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithFilters} />);
    
    expect(screen.getByText(/Búsqueda: "test company"/)).toBeInTheDocument();
    expect(screen.getByText('Sector: Tecnología')).toBeInTheDocument();
    expect(screen.getByText('Ubicación: Madrid')).toBeInTheDocument();
  });

  it('removes individual filters when tag close button is clicked', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...mockProps,
      searchTerm: 'test company',
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithFilters} />);
    
    // Remove search filter
    const searchTag = screen.getByText(/Búsqueda: "test company"/).closest('span');
    const searchCloseButton = searchTag?.querySelector('button');
    if (searchCloseButton) {
      await user.click(searchCloseButton);
      expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
    }
    
    // Remove industry filter
    const industryTag = screen.getByText('Sector: Tecnología').closest('span');
    const industryCloseButton = industryTag?.querySelector('button');
    if (industryCloseButton) {
      await user.click(industryCloseButton);
      expect(mockProps.onIndustryChange).toHaveBeenCalledWith('all');
    }
    
    // Remove location filter
    const locationTag = screen.getByText('Ubicación: Madrid').closest('span');
    const locationCloseButton = locationTag?.querySelector('button');
    if (locationCloseButton) {
      await user.click(locationCloseButton);
      expect(mockProps.onLocationChange).toHaveBeenCalledWith('all');
    }
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...mockProps,
      searchTerm: 'test company',
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithFilters} />);
    
    const clearButton = screen.getByText('Limpiar Filtros');
    await user.click(clearButton);
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
    expect(mockProps.onIndustryChange).toHaveBeenCalledWith('all');
    expect(mockProps.onLocationChange).toHaveBeenCalledWith('all');
  });

  it('does not show clear button or active filters when no filters are applied', () => {
    render(<CompanyFilters {...mockProps} />);
    
    expect(screen.queryByText('Limpiar Filtros')).not.toBeInTheDocument();
    expect(screen.queryByText(/Búsqueda:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sector:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ubicación:/)).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    expect(filterButton).toHaveAttribute('aria-expanded', 'false');
    expect(filterButton).toHaveAttribute('aria-controls', 'filters-panel');
    
    await user.click(filterButton);
    expect(filterButton).toHaveAttribute('aria-expanded', 'true');
    
    const filtersPanel = screen.getByRole('region', { hidden: true });
    expect(filtersPanel).toHaveAttribute('id', 'filters-panel');
  });

  it('has proper labels for select elements', async () => {
    const user = userEvent.setup();
    render(<CompanyFilters {...mockProps} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const industrySelect = screen.getByLabelText(/sector/i);
    expect(industrySelect).toHaveAttribute('id', 'industry-filter');
    
    const locationSelect = screen.getByLabelText(/ubicación/i);
    expect(locationSelect).toHaveAttribute('id', 'location-filter');
  });

  it('has proper aria-labels for remove buttons', () => {
    const propsWithFilters = {
      ...mockProps,
      searchTerm: 'test company',
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithFilters} />);
    
    expect(screen.getByLabelText('Eliminar filtro de búsqueda')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar filtro de sector')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar filtro de ubicación')).toBeInTheDocument();
  });

  it('maintains search input value', () => {
    const propsWithSearch = {
      ...mockProps,
      searchTerm: 'existing search',
    };
    
    render(<CompanyFilters {...propsWithSearch} />);
    
    const searchInput = screen.getByDisplayValue('existing search');
    expect(searchInput).toBeInTheDocument();
  });

  it('maintains selected values for selects', async () => {
    const user = userEvent.setup();
    const propsWithSelections = {
      ...mockProps,
      selectedIndustry: 'Tecnología',
      selectedLocation: 'Madrid',
    };
    
    render(<CompanyFilters {...propsWithSelections} />);
    
    // Open filters panel
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);
    
    const industrySelect = screen.getByLabelText(/sector/i) as HTMLSelectElement;
    const locationSelect = screen.getByLabelText(/ubicación/i) as HTMLSelectElement;
    
    expect(industrySelect.value).toBe('Tecnología');
    expect(locationSelect.value).toBe('Madrid');
  });
});
