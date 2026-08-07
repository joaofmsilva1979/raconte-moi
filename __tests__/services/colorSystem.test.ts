import { getPaletteByPrimary, getDefaultPalette } from '@/services/colorSystem';

describe('colorSystem', () => {
  it('retourne la palette Corail par défaut', () => {
    const palette = getDefaultPalette();
    expect(palette.primary).toBe('#E85520');
    expect(palette.name).toBe('Corail');
  });

  it('trouve une palette par sa couleur principale', () => {
    const palette = getPaletteByPrimary('#5C7A4E');
    expect(palette?.name).toBe('Sauge');
    expect(palette?.accent).toBe('#82A870');
    expect(palette?.background).toBe('#EEF5EC');
  });

  it('retourne null si la couleur n\'existe pas', () => {
    const palette = getPaletteByPrimary('#000000');
    expect(palette).toBeNull();
  });
});
