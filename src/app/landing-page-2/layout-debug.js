// Layout Debug Tool - Run in browser console to identify layout issues
// Usage: Copy and paste this code into the browser console on the landing page

(function() {
  console.log('🔍 Layout Debug Tool - Checking for horizontal overflow issues...');
  
  // Check viewport and document dimensions
  const viewportWidth = window.innerWidth;
  const documentWidth = document.documentElement.scrollWidth;
  const bodyWidth = document.body.scrollWidth;
  
  console.log('📏 Dimensions:');
  console.log(`  Viewport width: ${viewportWidth}px`);
  console.log(`  Document width: ${documentWidth}px`);
  console.log(`  Body width: ${bodyWidth}px`);
  
  if (documentWidth > viewportWidth || bodyWidth > viewportWidth) {
    console.warn('⚠️  HORIZONTAL OVERFLOW DETECTED!');
    console.log(`  Overflow amount: ${Math.max(documentWidth, bodyWidth) - viewportWidth}px`);
  } else {
    console.log('✅ No horizontal overflow detected');
  }
  
  // Check for elements that might be causing overflow
  const allElements = document.querySelectorAll('*');
  const problematicElements = [];
  
  allElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Check if element extends beyond viewport
    if (rect.right > viewportWidth) {
      problematicElements.push({
        element: element,
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        rightEdge: rect.right,
        overflow: rect.right - viewportWidth,
        width: rect.width,
        marginRight: computedStyle.marginRight,
        paddingRight: computedStyle.paddingRight
      });
    }
  });
  
  if (problematicElements.length > 0) {
    console.warn('🚨 Elements causing horizontal overflow:');
    problematicElements
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 10) // Show top 10 worst offenders
      .forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.tagName}${item.className ? '.' + item.className.split(' ')[0] : ''}${item.id ? '#' + item.id : ''}`);
        console.log(`     Right edge: ${item.rightEdge}px (overflow: ${item.overflow}px)`);
        console.log(`     Width: ${item.width}px`);
        console.log(`     Element:`, item.element);
      });
  } else {
    console.log('✅ No elements found extending beyond viewport');
  }
  
  // Check container-fluid elements specifically
  const containerFluids = document.querySelectorAll('.container-fluid');
  console.log(`\n🏗️  Container-fluid elements (${containerFluids.length} found):`);
  
  containerFluids.forEach((container, index) => {
    const rect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    
    console.log(`  ${index + 1}. Container-fluid:`);
    console.log(`     Width: ${rect.width}px`);
    console.log(`     Max-width: ${computedStyle.maxWidth}`);
    console.log(`     Padding: ${computedStyle.paddingLeft} | ${computedStyle.paddingRight}`);
    console.log(`     Right edge: ${rect.right}px`);
    
    if (rect.right > viewportWidth) {
      console.warn(`     ⚠️  This container extends beyond viewport by ${rect.right - viewportWidth}px`);
    }
  });
  
  // Check for CSS rules that might be causing issues
  console.log('\n🎨 CSS Analysis:');
  
  // Check if our fixes are applied
  const testElement = document.createElement('div');
  testElement.className = 'container-fluid';
  testElement.style.visibility = 'hidden';
  testElement.style.position = 'absolute';
  document.body.appendChild(testElement);
  
  const testStyle = window.getComputedStyle(testElement);
  console.log(`  Container-fluid max-width: ${testStyle.maxWidth}`);
  console.log(`  Container-fluid width: ${testStyle.width}`);
  
  document.body.removeChild(testElement);
  
  // Check body overflow settings
  const bodyStyle = window.getComputedStyle(document.body);
  const htmlStyle = window.getComputedStyle(document.documentElement);
  
  console.log(`  Body overflow-x: ${bodyStyle.overflowX}`);
  console.log(`  HTML overflow-x: ${htmlStyle.overflowX}`);
  console.log(`  Body max-width: ${bodyStyle.maxWidth}`);
  console.log(`  HTML max-width: ${htmlStyle.maxWidth}`);
  
  // Summary
  console.log('\n📋 Summary:');
  if (documentWidth <= viewportWidth && bodyWidth <= viewportWidth && problematicElements.length === 0) {
    console.log('✅ Layout appears to be fixed! No horizontal overflow detected.');
  } else {
    console.log('❌ Layout issues still present. Check the elements listed above.');
  }
  
  console.log('\n💡 To highlight problematic elements visually, run:');
  console.log('   document.querySelectorAll("*").forEach(el => { if(el.getBoundingClientRect().right > window.innerWidth) el.style.outline = "3px solid red"; });');
  
})();
