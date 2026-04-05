const fs = require('fs');
const path = './faculty-app/app/view-schedule.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace FlatList import with SectionList
content = content.replace('FlatList,', 'FlatList,\n  SectionList,');

// Build sectioned data
const sectionedData = `
  const sectionedSchedule = Object.keys(groupScheduleByDay())
    .map((day) => ({
      title: DAY_NAMES[parseInt(day)],
      data: groupScheduleByDay()[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }))
    .sort((a, b) => DAY_NAMES.indexOf(a.title) - DAY_NAMES.indexOf(b.title));

  const renderScheduleItem = ({ item }: { item: ClassScheduleItem }) => {
    let section = '-';
    let subject = item.subject || '-';
    if (item.subject && item.subject.includes(' - ')) {
      const parts = item.subject.split(' - ');
      section = parts[0];
      subject = parts.slice(1).join(' - ');
    }

    return (
      <View style={[styles.tableRow, item.substitute_request_id ? styles.tableRowSubstitute : null]}>
        <Text style={[styles.tableCell, styles.timeCell]}>
          {formatTime(item.start_time)}{'\\n'}-{formatTime(item.end_time)}
        </Text>
        <Text style={[styles.tableCell, styles.sectionCell]}>{section}</Text>
        <Text style={[styles.tableCell, styles.subjectCell]}>{subject}</Text>
        <Text style={[styles.tableCell, styles.roomCell]}>{item.classroom || '-'}</Text>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.timeCell, { textAlign: 'center' }]}>Time</Text>
        <Text style={[styles.tableHeaderCell, styles.sectionCell]}>Sec</Text>
        <Text style={[styles.tableHeaderCell, styles.subjectCell]}>Subject</Text>
        <Text style={[styles.tableHeaderCell, styles.roomCell]}>Room</Text>
      </View>
    </View>
  );
`;

// Replace renderScheduleItem
const renderItemMatch = /const renderScheduleItem = \S.*?\}\s*\);\s*/s;
content = content.replace(renderItemMatch, sectionedData);

// Replace FlatList with SectionList
const flatListMatch = /<FlatList\s+data=\{schedule\}\s+renderItem=\{renderScheduleItem\}\s+keyExtractor=\{\(item\) => `\$\{item.id\}`\}\s+contentContainerStyle=\{styles.listContent\}\s+refreshControl=\{([^}]*)\}\s+showsVerticalScrollIndicator=\{false\}\s*\/>/s;
const newSectionList = `<SectionList
          sections={sectionedSchedule}
          renderItem={renderScheduleItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => \`\${item.id}\`}
          contentContainerStyle={styles.listContent}
          refreshControl={$1}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />`;
content = content.replace(flatListMatch, newSectionList);

// Add styles
const newStyles = `
  sectionHeaderContainer: {
    backgroundColor: '#0F766E',
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableRowSubstitute: {
    backgroundColor: '#F5F3FF', // Light purple
  },
  tableCell: {
    fontSize: 12,
    color: '#4B5563',
  },
  timeCell: {
    flex: 2,
    textAlign: 'center',
  },
  sectionCell: {
    flex: 1.5,
    textAlign: 'center',
  },
  subjectCell: {
    flex: 3,
    paddingHorizontal: 4,
  },
  roomCell: {
    flex: 1.5,
    textAlign: 'center',
    fontWeight: '500',
  },`;

content = content.replace('listContent: {', newStyles + '\n  listContent: {');

fs.writeFileSync(path, content);
console.log('Done!');
