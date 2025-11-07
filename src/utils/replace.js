function replaceYalePreservingCase(text) {
  return text.replace(/yale/gi, (match) => {
    if (match === match.toUpperCase()) return 'FALE';       // YALE
    if (match === match.toLowerCase()) return 'fale';       // yale
    if (match[0] === match[0].toUpperCase()) return 'Fale'; // Yale
    return 'Fale';
  });
}

module.exports = { replaceYalePreservingCase };

