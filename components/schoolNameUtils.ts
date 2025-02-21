export function normalizeSchoolName(schoolName: string): string {
    return schoolName
      // Remove 'The' from the beginning
      .replace(/^The\s+/i, '')
      // Remove only 'School' suffix
      .replace(/\s+School$/i, '')
      // Convert to lowercase
      .toLowerCase()
      // Replace spaces and special characters with underscores
      .replace(/[^a-z0-9]+/g, '_')
      // Remove trailing underscores
      .replace(/_+$/, '')
      // Remove leading underscores
      .replace(/^_+/, '')
  }
  
  // Now it would output:
  normalizeSchoolName("Seton Hall Preparatory School")
  // Output: "seton_hall_preparatory" 