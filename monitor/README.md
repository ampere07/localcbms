# Live Monitoring Dashboard

A standalone PHP-based live monitoring dashboard for CBMS (Cable Billing Management System) with real-time data visualization, customizable widgets, and template management.

## Features

- **Real-time Dashboard**: Auto-refreshes every 15 seconds
- **Customizable Widgets**: Drag-and-drop GridStack layout
- **Multiple Visualization Types**: Bar, line, pie charts, and data tables
- **Template Management**: Save and load dashboard configurations
- **Dark/Light Mode**: Toggle between themes
- **Barangay Filtering**: Filter data by specific barangay
- **Date Range Filtering**: View data for specific time periods
- **Map Visualization**: Application locations on interactive maps
- **Color Customization**: Customize widget colors per widget
- **Responsive Design**: Works on desktop, tablet, and mobile

## Database Tables Used

The dashboard connects to the following tables from your `atsscbms_sync` database:

- `billing_accounts` - Billing status monitoring
- `billing_status` - Status name lookup
- `online_status` - Customer online/offline status
- `applications` - Application monitoring and mapping
- `service_orders` - Service order tracking
- `job_orders` - Job order tracking
- `expenses_log` - Expense tracking
- `expenses_category` - Expense categories
- `transactions` - Transaction monitoring
- `payment_portal_logs` - Portal payment logs
- `invoices` - Invoice monitoring
- `customers` - Customer information
- `barangay` - Barangay filtering

## Installation

1. **Database Setup**
   ```bash
   # Import the dashboard_templates table
   mysql -u root -p atsscbms_sync < dashboard_templates.sql
   ```

2. **Configuration**
   - Edit `config.php` and update database credentials:
     ```php
     $host = 'localhost';
     $db   = 'atsscbms_sync';
     $user = 'your_username';
     $pass = 'your_password';
     ```

3. **Authentication**
   - Edit `login.php` to integrate with your `users` table
   - Default credentials (CHANGE THESE):
     - Username: `admin`
     - Password: `admin`

4. **Web Server**
   - Place all files in your web server directory
   - Access via: `http://localhost/monitor/monitor.php`

## File Structure

```
monitor/
├── api.php              # Backend API for data fetching
├── auth.php             # Authentication check
├── config.php           # Database configuration
├── login.php            # Login page
├── monitor.php          # Main dashboard page
├── widgets.js           # Widget definitions and rendering
├── dashboard_templates.sql  # Database migration
└── README.md           # This file
```

## Available Widgets

### Status Monitoring
- **Billing Status** - Account status distribution
- **Online Status** - Customer connectivity status
- **Application Monitoring** - Application status tracking
- **SO Support Status** - Service order support tracking
- **SO Visit Status** - Service order visit tracking
- **JO Onsite Status** - Job order onsite tracking

### Performance Tracking
- **JO Queue** - Job order queue by technician
- **SO Queue** - Service order queue by technician
- **JO Tech Performance** - Job order completion rates
- **SO Tech Performance** - Service order completion rates
- **JO Refer Rank** - Top referrers

### Financial Monitoring
- **Expenses** - Expense tracking by category
- **Payment Methods** - Payment distribution by method
- **Invoice Status** - Monthly invoice tracking
- **Invoice Revenue** - Monthly revenue tracking
- **Transactions (#)** - Monthly transaction count
- **Transactions (Amt)** - Monthly transaction amount
- **Portal Logs (#)** - Portal payment count
- **Portal Logs (Amt)** - Portal payment amount
- **Invoice (Overall)** - Overall invoice status

### Geographic Visualization
- **Application Map** - Application locations on map

## Widget Controls

Each widget has controls accessible via hover at the bottom-left:

- **View Types**: Bar, Line, Pie charts, or List view
- **Percentage Toggle**: Show values as percentages
- **Text Alignment**: Left, Center, Right alignment
- **Font Size**: Increase/Decrease font size
- **Drag Handle**: Reposition widget

## Context Menu (Right-click on widget)

- **Rename Widget**: Custom widget titles
- **Accent Color**: Border and title color
- **Box Background**: Widget background color
- **Header Background**: Header section color
- **Inner Card Color**: Data card background color
- **Reset Styles**: Restore default styling
- **Hide Widget**: Remove from view

## Template Management

1. **Save Template**
   - Click Templates → Save View
   - Enter template name
   - Saves: Layout, Filters, Colors, Settings

2. **Load Template**
   - Click Templates → Manage Templates
   - Click on template to load
   - Delete unwanted templates

3. **Update Template**
   - Make changes to loaded template
   - Click Templates → Save View
   - Choose "Update Existing"

## Filtering Options

### Barangay Filter
- Select specific barangay from dropdown
- Available on: Billing, Applications, Job Orders, Service Orders

### Date Range Filter
- **Today/Overall Toggle**: Quick switch between today's data and all-time
- Available on most widgets

### Year Filter
- Select specific year for historical data
- Available on: Invoices, Transactions, Portal Logs

## API Endpoints

### Data Endpoints
- `?action=billing_status` - Billing account status
- `?action=online_status` - Online customer status
- `?action=app_status` - Application status
- `?action=so_status` - Service order status
- `?action=jo_status` - Job order status
- `?action=queue_mon` - Queue monitoring
- `?action=tech_mon_jo` - JO tech performance
- `?action=tech_mon_so` - SO tech performance
- `?action=expenses_mon` - Expense monitoring
- `?action=pay_method_mon` - Payment methods
- `?action=invoice_mon` - Invoice monitoring
- `?action=transactions_mon` - Transaction monitoring
- `?action=portal_mon` - Portal logs
- `?action=app_map` - Application map data
- `?action=jo_refer_rank` - Referral rankings
- `?action=invoice_overall` - Overall invoice status

### Template Endpoints
- `?action=save_template` (POST) - Save new template
- `?action=update_template` (POST) - Update template
- `?action=list_templates` - List all templates
- `?action=load_template&id=X` - Load specific template
- `?action=delete_template` (POST) - Delete template

## Query Parameters

- `scope` - 'today' or 'overall' (default)
- `bgy` - Barangay name or 'All' (default)
- `year` - Year for historical data
- `param` - Specific parameter for query

## Technologies Used

- **Backend**: PHP 8.x, PDO, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**:
  - Bootstrap 5.3.0 - UI framework
  - GridStack 7.2.3 - Drag-and-drop layout
  - Chart.js 4.x - Data visualization
  - Leaflet 1.9.4 - Interactive maps
  - Font Awesome 6.0.0 - Icons

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- Auto-refresh interval: 15 seconds
- Query logs: Last 50 queries stored
- LocalStorage used for: Layout, Colors, Templates, Theme
- Template storage: Database (persistent)

## Security Considerations

1. **Change default login credentials** in `login.php`
2. **Integrate with your user authentication system**
3. **Use prepared statements** for all queries (already implemented)
4. **Enable HTTPS** in production
5. **Restrict file access** via `.htaccess` or web server config

## Troubleshooting

### Database Connection Error
- Check `config.php` credentials
- Verify database server is running
- Confirm database name is `atsscbms_sync`

### Empty Widgets
- Check if tables have data
- Verify date ranges in filters
- Check browser console for errors
- Review Query Logs modal for API errors

### Map Not Showing
- Verify `address_coordinates` format in applications table
- Check Leaflet CDN is accessible
- Ensure coordinates are valid lat/long format

### Templates Not Saving
- Run `dashboard_templates.sql` migration
- Check database permissions
- Verify browser console for errors

## Customization

### Adding New Widgets

1. **Define Widget** in `widgets.js`:
```javascript
"w_new_widget": { 
    title: "Widget Title", 
    w: 4, h: 4, 
    type: 'chart', 
    api: 'new_api_endpoint', 
    hasFilters: true, 
    filterType: 'toggle_today', 
    param: 'param_name' 
}
```

2. **Add API Endpoint** in `api.php`:
```php
elseif ($action === 'new_api_endpoint') {
    $query = "SELECT label, value FROM your_table WHERE ...";
}
```

### Changing Default Layout

Edit `renderWidgets()` in `monitor.php`:
```javascript
let layout = savedLayout || [
    {id: 'w_widget_id', x: 0, y: 0, w: 4, h: 4}
];
```

## Support

For issues or questions:
1. Check Query Logs modal in dashboard
2. Review browser console for JavaScript errors
3. Check PHP error logs
4. Verify database table structure matches schema

## License

Proprietary - All rights reserved
