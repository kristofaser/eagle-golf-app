const fs = require('fs');

// Function to clean phone numbers
function cleanPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle French numbers
    if (cleaned.startsWith('+33')) {
        cleaned = cleaned.substring(3);
        if (cleaned.length === 9) {
            cleaned = '0' + cleaned;
        }
    }
    
    // Format as French number
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return cleaned || null;
}

// Function to extract department from postal code
function extractDepartment(postalCode) {
    if (!postalCode) return null;
    if (postalCode.length >= 2) {
        return postalCode.substring(0, 2);
    }
    return null;
}

// Function to parse coordinates
function parseCoordinates(coordString) {
    if (!coordString) return { latitude: null, longitude: null };
    
    const coords = coordString.split(',').map(c => c.trim());
    if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
        }
    }
    return { latitude: null, longitude: null };
}

// Function to extract holes count
function extractHolesCount(text) {
    if (!text) return null;
    
    const match = text.match(/(\d+)\s*trous?/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

// Function to escape SQL strings
function escapeSqlString(str) {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
}

// Main parsing function
function parseGolfData() {
    const content = fs.readFileSync('/Users/christophe/Projets/Eagle/liste-golf-enrichie.md', 'utf8');
    const lines = content.split('\n');
    
    const golfCourses = [];
    let currentGolf = null;
    let inGolfSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip header and metadata lines
        if (line.startsWith('#') || line.startsWith('**') && !line.includes('|')) {
            continue;
        }
        
        // Check for golf course header (format: **Golf Name | Postal Code City**)
        if (line.startsWith('**') && line.includes('|') && line.endsWith('**')) {
            // Save previous golf if exists
            if (currentGolf) {
                golfCourses.push(currentGolf);
            }
            
            // Parse new golf header
            const headerText = line.replace(/\*\*/g, '').trim();
            const parts = headerText.split('|');
            
            if (parts.length >= 2) {
                const golfName = parts[0].trim();
                const locationPart = parts[1].trim();
                
                // Extract postal code and city
                let postalCode = null;
                let city = null;
                
                // Try to match postal code at the beginning
                const locationMatch = locationPart.match(/^(\d{5})\s+(.+)$/);
                if (locationMatch) {
                    postalCode = locationMatch[1];
                    city = locationMatch[2];
                } else {
                    // If no postal code at start, check if the location part is just a postal code
                    const postalOnlyMatch = locationPart.match(/^(\d{5})$/);
                    if (postalOnlyMatch) {
                        postalCode = postalOnlyMatch[1];
                        city = null;
                    } else {
                        // Check if postal code is at the end
                        const postalEndMatch = locationPart.match(/^(.+)\s+(\d{5})$/);
                        if (postalEndMatch) {
                            city = postalEndMatch[1];
                            postalCode = postalEndMatch[2];
                        } else {
                            city = locationPart;
                        }
                    }
                }
                
                currentGolf = {
                    name: golfName,
                    city: city,
                    postal_code: postalCode,
                    department: extractDepartment(postalCode),
                    phone: null,
                    email: null,
                    website: null,
                    latitude: null,
                    longitude: null,
                    holes_count: null,
                    description: null
                };
                
                inGolfSection = true;
            }
        }
        // Parse contact information
        else if (inGolfSection && currentGolf && line.startsWith('-')) {
            const infoLine = line.substring(1).trim();
            
            if (infoLine.startsWith('📞')) {
                const phone = infoLine.replace('📞', '').trim();
                currentGolf.phone = cleanPhoneNumber(phone);
            }
            else if (infoLine.startsWith('📧')) {
                const email = infoLine.replace('📧', '').trim();
                // Clean email - remove "Non disponible" and similar
                if (email && !email.toLowerCase().includes('non disponible') && !email.toLowerCase().includes('n/a') && email.includes('@')) {
                    currentGolf.email = email;
                } else {
                    currentGolf.email = null;
                }
            }
            else if (infoLine.startsWith('🌐')) {
                const website = infoLine.replace('🌐', '').trim();
                currentGolf.website = website || null;
            }
            else if (infoLine.startsWith('📍')) {
                const coordInfo = infoLine.replace('📍', '').trim();
                
                // Split by | to separate coordinates and holes info
                const parts = coordInfo.split('|');
                
                if (parts.length >= 1) {
                    const { latitude, longitude } = parseCoordinates(parts[0].trim());
                    currentGolf.latitude = latitude;
                    currentGolf.longitude = longitude;
                }
                
                if (parts.length >= 2) {
                    const holesInfo = parts[1].trim();
                    currentGolf.holes_count = extractHolesCount(holesInfo);
                    
                    // Store additional description
                    if (holesInfo) {
                        currentGolf.description = holesInfo;
                    }
                }
            }
        }
        // Check for empty line or new section
        else if (line === '' || line.startsWith('###') || line.startsWith('##')) {
            inGolfSection = false;
        }
    }
    
    // Add the last golf course
    if (currentGolf) {
        golfCourses.push(currentGolf);
    }
    
    return golfCourses;
}

// Generate SQL INSERT statements
function generateSqlInserts(golfCourses) {
    const sqlStatements = [];
    
    // Add table creation statement
    sqlStatements.push(`-- Golf courses table structure
-- Make sure this table exists in your Supabase database:
/*
CREATE TABLE golf_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    city VARCHAR,
    postal_code VARCHAR(5),
    department VARCHAR(2),
    phone VARCHAR,
    email VARCHAR,
    website VARCHAR,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    holes_count INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
*/`);
    
    sqlStatements.push('');
    sqlStatements.push('-- INSERT statements for golf courses data');
    sqlStatements.push('');
    
    for (const golf of golfCourses) {
        const values = [
            escapeSqlString(golf.name),
            escapeSqlString(golf.city),
            golf.postal_code ? `'${golf.postal_code}'` : 'NULL',
            golf.department ? `'${golf.department}'` : 'NULL',
            escapeSqlString(golf.phone),
            escapeSqlString(golf.email),
            escapeSqlString(golf.website),
            golf.latitude !== null ? golf.latitude : 'NULL',
            golf.longitude !== null ? golf.longitude : 'NULL',
            golf.holes_count !== null ? golf.holes_count : 'NULL',
            escapeSqlString(golf.description)
        ];
        
        const sql = `INSERT INTO golf_courses (name, city, postal_code, department, phone, email, website, latitude, longitude, holes_count, description) VALUES (${values.join(', ')});`;
        sqlStatements.push(sql);
    }
    
    return sqlStatements.join('\n');
}

// Execute parsing
try {
    console.log('Starting golf data parsing...');
    const golfCourses = parseGolfData();
    console.log(`Parsed ${golfCourses.length} golf courses`);
    
    // Show sample of parsed data
    console.log('\nSample of parsed data:');
    console.log(JSON.stringify(golfCourses.slice(0, 3), null, 2));
    
    // Generate SQL
    const sqlScript = generateSqlInserts(golfCourses);
    
    // Write SQL to file
    fs.writeFileSync('/Users/christophe/Projets/Eagle/golf-courses-insert.sql', sqlScript, 'utf8');
    console.log('\nSQL INSERT script generated: golf-courses-insert.sql');
    
    // Show statistics
    const stats = {
        total: golfCourses.length,
        withPhone: golfCourses.filter(g => g.phone).length,
        withEmail: golfCourses.filter(g => g.email).length,
        withWebsite: golfCourses.filter(g => g.website).length,
        withCoordinates: golfCourses.filter(g => g.latitude && g.longitude).length,
        withHoles: golfCourses.filter(g => g.holes_count).length,
        departments: [...new Set(golfCourses.map(g => g.department).filter(Boolean))].length
    };
    
    console.log('\nStatistics:');
    console.log(`- Total golf courses: ${stats.total}`);
    console.log(`- With phone: ${stats.withPhone} (${Math.round(stats.withPhone/stats.total*100)}%)`);
    console.log(`- With email: ${stats.withEmail} (${Math.round(stats.withEmail/stats.total*100)}%)`);
    console.log(`- With website: ${stats.withWebsite} (${Math.round(stats.withWebsite/stats.total*100)}%)`);
    console.log(`- With coordinates: ${stats.withCoordinates} (${Math.round(stats.withCoordinates/stats.total*100)}%)`);
    console.log(`- With holes count: ${stats.withHoles} (${Math.round(stats.withHoles/stats.total*100)}%)`);
    console.log(`- Departments covered: ${stats.departments}`);
    
} catch (error) {
    console.error('Error parsing golf data:', error);
}