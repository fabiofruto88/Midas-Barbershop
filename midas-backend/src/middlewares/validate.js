// Valida body/params/query con esquemas Zod y deja los datos ya limpios en `req.validated`.
// (En Express 5 `req.query` es de solo lectura, por eso no se sobrescribe.)
const validate = (schemas) => (req, res, next) => {
  // Se acumula: una ruta puede validar en varios pasos (ej. params antes y body después de Multer).
  req.validated ??= {};

  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || part,
        message: issue.message,
      }));
      return res.status(400).json({ error: details[0].message, details });
    }
    req.validated[part] = result.data;
  }

  next();
};

module.exports = validate;
