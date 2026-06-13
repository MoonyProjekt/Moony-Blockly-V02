// js/theme.js
(function () {

  if (typeof Blockly === "undefined" || !Blockly.Theme) return;

  const MoonyDark = Blockly.Theme.defineTheme('moonydark', {
    base: Blockly.Themes.Classic,

    blockStyles: {

      // ============================================================
      // ✅ HAUPT-STYLES
      // ============================================================

      start_blocks: {
        colourPrimary: '#F97316',
        colourSecondary: '#EA580C',
        colourTertiary: '#C2410C',
      },

      logic_blocks: {
        colourPrimary: '#2563EB',
        colourSecondary: '#1D4ED8',
        colourTertiary: '#1E40AF',
      },

      loop_blocks: {
        colourPrimary: '#16A34A',
        colourSecondary: '#15803D',
        colourTertiary: '#166534',
      },

      math_blocks: {
        colourPrimary: '#9333EA',
        colourSecondary: '#7E22CE',
        colourTertiary: '#6B21A8',
      },

      text_blocks: {
        colourPrimary: '#FACC15',
        colourSecondary: '#EAB308',
        colourTertiary: '#CA8A04',
      },

      movement_blocks: {
        colourPrimary: '#7C3F00',
        colourSecondary: '#5B2C00',
        colourTertiary: '#3A1C00',
      },

      servo_blocks: {
        colourPrimary: '#0EA5A4',
        colourSecondary: '#0D9488',
        colourTertiary: '#0F766E',
      },

      time_blocks: {
        colourPrimary: '#F472B6',
        colourSecondary: '#EC4899',
        colourTertiary: '#DB2777',
      },

      sensor_blocks: {
        colourPrimary: '#DC2626',
        colourSecondary: '#B91C1C',
        colourTertiary: '#991B1B',
      },

      sound_blocks: {
        colourPrimary: '#22C55E',
        colourSecondary: '#16A34A',
        colourTertiary: '#15803D',
      },

      led_blocks: {
        colourPrimary: '#F59E0B',
        colourSecondary: '#D97706',
        colourTertiary: '#B45309',
      },

      animation_blocks: {
        colourPrimary: '#1E3A8A',
        colourSecondary: '#1E40AF',
        colourTertiary: '#1D4ED8',
      },

      communication_blocks: {
        colourPrimary: '#06B6D4',
        colourSecondary: '#0891B2',
        colourTertiary: '#0E7490',
      },

      radio_blocks: {
        colourPrimary: '#22D3EE',
        colourSecondary: '#06B6D4',
        colourTertiary: '#0891B2',
      },

      // ============================================================
      // ✅ PRIMARY / SECONDARY / TERTIARY
      // ============================================================

      start_primary:   { colourPrimary:'#F97316', colourSecondary:'#EA580C', colourTertiary:'#C2410C' },
      start_secondary: { colourPrimary:'#EA580C', colourSecondary:'#C2410C', colourTertiary:'#9A3412' },
      start_tertiary:  { colourPrimary:'#C2410C', colourSecondary:'#9A3412', colourTertiary:'#7C2D12' },

      logic_primary:   { colourPrimary:'#2563EB', colourSecondary:'#1D4ED8', colourTertiary:'#1E40AF' },
      logic_secondary: { colourPrimary:'#1D4ED8', colourSecondary:'#1E40AF', colourTertiary:'#1E3A8A' },
      logic_tertiary:  { colourPrimary:'#1E40AF', colourSecondary:'#1E3A8A', colourTertiary:'#172554' },

      loop_primary:   { colourPrimary:'#16A34A', colourSecondary:'#15803D', colourTertiary:'#166534' },
      loop_secondary: { colourPrimary:'#15803D', colourSecondary:'#166534', colourTertiary:'#14532D' },
      loop_tertiary:  { colourPrimary:'#166534', colourSecondary:'#14532D', colourTertiary:'#052E16' },

      math_primary:   { colourPrimary:'#9333EA', colourSecondary:'#7E22CE', colourTertiary:'#6B21A8' },
      math_secondary: { colourPrimary:'#7E22CE', colourSecondary:'#6B21A8', colourTertiary:'#581C87' },
      math_tertiary:  { colourPrimary:'#6B21A8', colourSecondary:'#581C87', colourTertiary:'#3B0764' },

      text_primary:   { colourPrimary:'#FACC15', colourSecondary:'#EAB308', colourTertiary:'#CA8A04' },
      text_secondary: { colourPrimary:'#EAB308', colourSecondary:'#CA8A04', colourTertiary:'#A16207' },
      text_tertiary:  { colourPrimary:'#CA8A04', colourSecondary:'#A16207', colourTertiary:'#713F12' },

      movement_primary:   { colourPrimary:'#7C3F00', colourSecondary:'#5B2C00', colourTertiary:'#3A1C00' },
      movement_secondary: { colourPrimary:'#5B2C00', colourSecondary:'#3A1C00', colourTertiary:'#2A1200' },
      movement_tertiary:  { colourPrimary:'#3A1C00', colourSecondary:'#2A1200', colourTertiary:'#1A0B00' },

      servo_primary:   { colourPrimary:'#0EA5A4', colourSecondary:'#0D9488', colourTertiary:'#0F766E' },
      servo_secondary: { colourPrimary:'#0D9488', colourSecondary:'#0F766E', colourTertiary:'#134E4A' },
      servo_tertiary:  { colourPrimary:'#0F766E', colourSecondary:'#134E4A', colourTertiary:'#042F2E' },

      time_primary:   { colourPrimary:'#F472B6', colourSecondary:'#EC4899', colourTertiary:'#DB2777' },
      time_secondary: { colourPrimary:'#EC4899', colourSecondary:'#DB2777', colourTertiary:'#BE185D' },
      time_tertiary:  { colourPrimary:'#DB2777', colourSecondary:'#BE185D', colourTertiary:'#9D174D' },

      sensor_primary:   { colourPrimary:'#DC2626', colourSecondary:'#B91C1C', colourTertiary:'#991B1B' },
      sensor_secondary: { colourPrimary:'#B91C1C', colourSecondary:'#991B1B', colourTertiary:'#7F1D1D' },
      sensor_tertiary:  { colourPrimary:'#991B1B', colourSecondary:'#7F1D1D', colourTertiary:'#450A0A' },

      sound_primary:   { colourPrimary:'#22C55E', colourSecondary:'#16A34A', colourTertiary:'#15803D' },
      sound_secondary: { colourPrimary:'#16A34A', colourSecondary:'#15803D', colourTertiary:'#166534' },
      sound_tertiary:  { colourPrimary:'#15803D', colourSecondary:'#166534', colourTertiary:'#14532D' },

      led_primary:   { colourPrimary:'#F59E0B', colourSecondary:'#D97706', colourTertiary:'#B45309' },
      led_secondary: { colourPrimary:'#D97706', colourSecondary:'#B45309', colourTertiary:'#92400E' },
      led_tertiary:  { colourPrimary:'#B45309', colourSecondary:'#92400E', colourTertiary:'#78350F' },

      animation_primary:   { colourPrimary:'#1E3A8A', colourSecondary:'#1E40AF', colourTertiary:'#1D4ED8' },
      animation_secondary: { colourPrimary:'#1E40AF', colourSecondary:'#1D4ED8', colourTertiary:'#2563EB' },
      animation_tertiary:  { colourPrimary:'#1D4ED8', colourSecondary:'#2563EB', colourTertiary:'#1E3A8A' },

      communication_primary:   { colourPrimary:'#06B6D4', colourSecondary:'#0891B2', colourTertiary:'#0E7490' },
      communication_secondary: { colourPrimary:'#0891B2', colourSecondary:'#0E7490', colourTertiary:'#155E75' },
      communication_tertiary:  { colourPrimary:'#0E7490', colourSecondary:'#155E75', colourTertiary:'#164E63' },

      // ============================================================
      // ✅ SUB-STYLES FÜR BESTEHENDE BLOCKDATEIEN
      // ============================================================

      sound_buzzer_blocks: {
        colourPrimary: '#16A34A',
        colourSecondary: '#15803D',
        colourTertiary: '#166534',
      },

      sound_music_blocks: {
        colourPrimary: '#4ADE80',
        colourSecondary: '#22C55E',
        colourTertiary: '#16A34A',
      },

      matrix_blocks: {
        colourPrimary: '#14B8A6',
        colourSecondary: '#0D9488',
        colourTertiary: '#0F766E',
      },

      ring_blocks: {
        colourPrimary: '#EC4899',
        colourSecondary: '#DB2777',
        colourTertiary: '#BE185D',
      },

      sensor_ultra: {
        colourPrimary: '#2563EB',
        colourSecondary: '#1D4ED8',
        colourTertiary: '#1E40AF',
      },

      sensor_tof: {
        colourPrimary: '#9333EA',
        colourSecondary: '#7E22CE',
        colourTertiary: '#6B21A8',
      },

      sensor_button: {
        colourPrimary: '#F97316',
        colourSecondary: '#EA580C',
        colourTertiary: '#C2410C',
      },

      sensor_switch: {
        colourPrimary: '#14B8A6',
        colourSecondary: '#0D9488',
        colourTertiary: '#0F766E',
      },

      sensor_soil: {
        colourPrimary: '#65A30D',
        colourSecondary: '#4D7C0F',
        colourTertiary: '#3F6212',
      },
    },

    categoryStyles: {
      start_category: { colour: '#F97316' },
      logic_category: { colour: '#2563EB' },
      loop_category: { colour: '#16A34A' },
      math_category: { colour: '#9333EA' },
      text_category: { colour: '#FACC15' },
      movement_category: { colour: '#7C3F00' },
      servo_category: { colour: '#0EA5A4' },
      time_category: { colour: '#F472B6' },
      sensor_category: { colour: '#DC2626' },
      sound_category: { colour: '#22C55E' },
      led_category: { colour: '#F59E0B' },
      animation_category: { colour: '#1E3A8A' },
      communication_category: { colour: '#06B6D4' },
    },

    componentStyles: {
      workspaceBackgroundColour: '#E4E3DA',
      toolboxBackgroundColour: '#141F3D',
      toolboxForegroundColour: '#E9E1BE',
      flyoutBackgroundColour: '#162347',
      flyoutForegroundColour: '#E9E1BE',
      flyoutOpacity: 0.95,
      scrollbarColour: '#343A46',
      cursorColour: '#E9E1BE',
      selectedGlowColour: '#F97316',
      selectedGlowSize: 1,
      insertionMarkerColour: '#16A34A',
      insertionMarkerOpacity: 0.6,
      replacementGlowColour: '#F97316',
      replacementGlowSize: 1,
    },

    fontStyle: {
      family: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      weight: '500',
      size: 14,
    },

  });

  Blockly.Themes.MoonyDark = MoonyDark;
})();