const Student = require('../models/studentModel');
const xlsx = require('xlsx');

// Create a new student
exports.createStudent = (req, res) => {
  const { name, gender, age, roll_number, type } = req.body;
  const { center_id } = req.center;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Student name is required' });
  }

  // Validate type field
  const validTypes = ['Kumar', 'Kumari', 'Adhar Kumar', 'Adhar Kumari', 'Mata'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ message: 'Valid student type is required' });
  }

  // Check for duplicate names
  Student.findByName(name, center_id, (err, existingStudents) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking student name', error: err.message });
    }

    if (existingStudents && existingStudents.length > 0) {
      // Find similar names to suggest alternatives
      Student.findSimilarNames(name, center_id, (err, similarStudents) => {
        if (err) {
          return res.status(500).json({ message: 'Error checking similar names', error: err.message });
        }

        // Generate name suggestions
        const suggestions = generateNameSuggestions(name, existingStudents, similarStudents);
        
        return res.status(400).json({
          message: 'A student with this name already exists.',
          existingStudents: existingStudents.map(s => ({
            name: s.name,
            roll_number: s.roll_number,
            type: s.type
          })),
          suggestions: suggestions
        });
      });
      return;
    }

    // If roll number is provided, check if it already exists
    if (roll_number) {
      Student.findByRollNumber(roll_number, center_id, (err, existingStudent) => {
        if (err) {
          return res.status(500).json({ message: 'Error checking roll number', error: err.message });
        }
        
        if (existingStudent) {
          return res.status(400).json({ 
            message: `Roll number ${roll_number} is already assigned to student: ${existingStudent.name}`
          });
        }
        
        // Roll number is unique, proceed with creation
        createNewStudent();
      });
    } else {
      // No roll number provided, proceed with creation
      createNewStudent();
    }
  });

  function createNewStudent() {
    Student.create({ name, gender, age, center_id, roll_number, type }, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating student', error: err.message });
      }
      
      res.status(201).json({
        message: 'Student created successfully',
        student: {
          id: result.id,
          roll_number: result.roll_number
        }
      });
    });
  }
};

// Get all students for a center
exports.getAllStudents = (req, res) => {
  const { center_id } = req.center;
  
  Student.getAllByCenter(center_id, (err, students) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving students', error: err.message });
    }
    
    res.status(200).json({ students });
  });
};

// Get student by ID
exports.getStudentById = (req, res) => {
  const { id } = req.params;
  
  Student.findById(id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== req.center.center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json({ student });
  });
};

// Get student by roll number
exports.getStudentByRollNumber = (req, res) => {
  const { roll_number } = req.params;
  const { center_id } = req.center;
  
  Student.findByRollNumber(roll_number, center_id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.status(200).json({ student });
  });
};

// Update student
exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const { name, gender, age, roll_number, type } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Student name is required' });
  }

  // Validate type field
  const validTypes = ['Kumar', 'Kumari', 'Adhar Kumar', 'Adhar Kumari', 'Mata'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ message: 'Valid student type is required' });
  }
  
  // First check if student exists and belongs to this center
  Student.findById(id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== req.center.center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If name is changed, check for duplicates
    if (name !== student.name) {
      Student.findByName(name, req.center.center_id, (err, existingStudents) => {
        if (err) {
          return res.status(500).json({ message: 'Error checking student name', error: err.message });
        }

        if (existingStudents && existingStudents.length > 0) {
          // Find similar names to suggest alternatives
          Student.findSimilarNames(name, req.center.center_id, (err, similarStudents) => {
            if (err) {
              return res.status(500).json({ message: 'Error checking similar names', error: err.message });
            }

            // Generate name suggestions
            const suggestions = generateNameSuggestions(name, existingStudents, similarStudents);
            
            return res.status(400).json({
              message: 'A student with this name already exists.',
              existingStudents: existingStudents.map(s => ({
                name: s.name,
                roll_number: s.roll_number,
                type: s.type
              })),
              suggestions: suggestions
            });
          });
          return;
        }

        // Name is unique, proceed with roll number check
        checkRollNumber();
      });
    } else {
      // Name not changed, proceed with roll number check
      checkRollNumber();
    }

    function checkRollNumber() {
      // If roll number is changed, check if the new roll number is unique
      if (roll_number && roll_number !== student.roll_number) {
        Student.findByRollNumber(roll_number, req.center.center_id, (err, existingStudent) => {
          if (err) {
            return res.status(500).json({ message: 'Error checking roll number', error: err.message });
          }
          
          if (existingStudent) {
            return res.status(400).json({ 
              message: `Roll number ${roll_number} is already assigned to student: ${existingStudent.name}`
            });
          }
          
          // Roll number is unique, proceed with update
          updateExistingStudent();
        });
      } else {
        // Roll number not changed, proceed with update
        updateExistingStudent();
      }
    }

    function updateExistingStudent() {
      Student.update(id, { name, gender, age, roll_number, type }, (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating student', error: err.message });
        }
        
        res.status(200).json({
          message: 'Student updated successfully',
          changes: result.changes
        });
      });
    }
  });
};

// Delete student
exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  
  // First check if student exists and belongs to this center
  Student.findById(id, (err, student) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving student', error: err.message });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify student belongs to this center
    if (student.center_id !== req.center.center_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete student
    Student.delete(id, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting student', error: err.message });
      }
      
      res.status(200).json({
        message: 'Student deleted successfully',
        changes: result.changes
      });
    });
  });
};

// Import students from Excel file
exports.importStudents = async (req, res) => {
  const { center_id } = req.center;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ message: 'File is empty or has no data rows.' });
    }

    // Assuming header row is the first row
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const studentData = data.slice(1);

    const requiredHeaders = ['roll_number', 'name', 'type'];
    if (!requiredHeaders.every(h => headers.includes(h))) {
      return res.status(400).json({ 
        message: `File must contain columns: ${requiredHeaders.join(', ')}` 
      });
    }

    const rollNumberIndex = headers.indexOf('roll_number');
    const nameIndex = headers.indexOf('name');
    const genderIndex = headers.indexOf('gender');
    const ageIndex = headers.indexOf('age');
    const typeIndex = headers.indexOf('type');

    const validTypes = ['Kumar', 'Kumari', 'Adhar Kumar', 'Adhar Kumari', 'Mata'];
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      addedStudents: []
    };

    // Validate and process each row
    for (let i = 0; i < studentData.length; i++) {
      const row = studentData[i];
      const rowNum = i + 2; // Excel row number (1-based, plus header)

      const roll_number = String(row[rollNumberIndex] || '').trim();
      const name = String(row[nameIndex] || '').trim();
      const gender = (genderIndex >= 0 && row[genderIndex]) ? String(row[genderIndex]).trim() : null;
      const age = (ageIndex >= 0 && row[ageIndex] && !isNaN(parseInt(row[ageIndex], 10))) ? parseInt(row[ageIndex], 10) : null;
      const type = (typeIndex >= 0 && row[typeIndex]) ? String(row[typeIndex]).trim() : null;
      
      // --- Validation --- 
      if (!roll_number) {
        results.errors.push(`Row ${rowNum}: Roll number is required.`);
        results.errorCount++;
        continue;
      }
      if (!name) {
        results.errors.push(`Row ${rowNum}: Name is required.`);
        results.errorCount++;
        continue;
      }
      if (!type || !validTypes.includes(type)) {
        results.errors.push(`Row ${rowNum}: Valid type is required (${validTypes.join(', ')}).`);
        results.errorCount++;
        continue;
      }
      if (!/^\d{3}$/.test(roll_number)) {
        results.errors.push(`Row ${rowNum}: Roll number must be exactly 3 digits.`);
        results.errorCount++;
        continue;
      }

      // Check for duplicate roll number within the file itself (to avoid issues in batch insert)
      if (studentData.slice(0, i).some(prevRow => String(prevRow[rollNumberIndex] || '').trim() === roll_number)) {
        results.errors.push(`Row ${rowNum}: Duplicate roll number (${roll_number}) found within the file.`);
        results.errorCount++;
        continue;
      }
      
      // Check if roll number already exists in DB for this center (using await for simplicity here)
      try {
        const existing = await new Promise((resolve, reject) => {
          Student.findByRollNumber(roll_number, center_id, (err, student) => {
            if (err) reject(err);
            else resolve(student);
          });
        });
        if (existing) {
          results.errors.push(`Row ${rowNum}: Roll number ${roll_number} already exists in the database.`);
          results.errorCount++;
          continue;
        }
      } catch (dbErr) {
        results.errors.push(`Row ${rowNum}: Database error checking roll number ${roll_number}.`);
        results.errorCount++;
        console.error('DB error checking roll:', dbErr);
        continue;
      }

      // --- Add Student (if validation passes) --- 
      try {
        const created = await new Promise((resolve, reject) => {
          Student.create({ roll_number, name, gender, age, center_id, type }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        results.successCount++;
        results.addedStudents.push({ roll_number: created.roll_number, name: name });
      } catch (createErr) {
        results.errors.push(`Row ${rowNum}: Failed to add student ${name} (${roll_number}). Error: ${createErr.message}`);
        results.errorCount++;
      }
    }

    // Send response back to client
    if (results.errorCount > 0) {
      return res.status(400).json({
        message: `Import completed with ${results.errorCount} errors. ${results.successCount} students added.`,
        results
      });
    } else {
      return res.status(200).json({
        message: `Successfully imported ${results.successCount} students.`,
        results
      });
    }

  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ message: 'Error processing file.', error: error.message });
  }
};

// Search students by roll number or name
exports.searchStudents = (req, res) => {
  const { search } = req.query;
  const { center_id } = req.center;
  
  if (!search) {
    return res.status(400).json({ message: 'Search term is required' });
  }
  
  Student.searchStudents(search, center_id, (err, students) => {
    if (err) {
      return res.status(500).json({ message: 'Error searching students', error: err.message });
    }
    
    res.status(200).json({ students });
  });
};

// Helper function to generate name suggestions
function generateNameSuggestions(name, existingStudents, similarStudents) {
  const suggestions = [];
  
  // Add type-based suggestions
  suggestions.push(`${name} Kumar`);
  suggestions.push(`${name} Kumari`);
  
  // Add number-based suggestions
  let counter = 2;
  while (suggestions.length < 5) {
    const suggestion = `${name} ${counter}`;
    if (!existingStudents.some(s => s.name.toLowerCase() === suggestion.toLowerCase())) {
      suggestions.push(suggestion);
    }
    counter++;
  }
  
  // Add parent-based suggestions
  suggestions.push(`${name} (S/O)`);
  suggestions.push(`${name} (D/O)`);
  
  return suggestions.filter(suggestion => 
    !existingStudents.some(s => s.name.toLowerCase() === suggestion.toLowerCase())
  );
} 