// ABOUTME: Site-wide footer component with data source attribution
// ABOUTME: Displays ISBE data source link and last updated date

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          Data Source:{' '}
          <a
            href="https://www.isbe.net/Pages/Illinois-State-Report-Card-Data.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Illinois State Board of Education
          </a>
          {' | '}
          Report Card Data | Last Updated: November 13, 2025
        </p>
      </div>
    </footer>
  );
}
